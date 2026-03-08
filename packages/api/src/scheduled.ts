import { getDb } from "./db/connection.js";
import { eq, and, lt, lte, isNotNull, isNull, or, sql } from "drizzle-orm";
import * as schema from "@cyh/shared/db";
import { syncGoogleCalendarEvents } from "./routes/google-calendar.js";

export async function handler() {
  const db = await getDb();

  // Sync events from Facebook Pages that have a connected token
  const orgsWithFb = await db
    .select()
    .from(schema.organizations)
    .where(
      and(
        isNotNull(schema.organizations.facebookPageId),
        isNotNull(schema.organizations.facebookPageToken)
      )
    );

  for (const org of orgsWithFb) {
    try {
      await syncFacebookEvents(db, org);
    } catch (err) {
      console.error(`Failed to sync FB events for org ${org.id}:`, err);
    }
  }

  // Sync iCal feeds
  const orgsWithIcal = await db
    .select()
    .from(schema.organizations)
    .where(isNotNull(schema.organizations.icalFeedUrl));

  for (const org of orgsWithIcal) {
    try {
      await syncIcalEvents(db, org);
    } catch (err) {
      console.error(`Failed to sync iCal events for org ${org.id}:`, err);
    }
  }

  // Sync Google Calendar events
  const orgsWithGoogle = await db
    .select()
    .from(schema.organizations)
    .where(
      and(
        isNotNull(schema.organizations.googleRefreshToken),
        isNotNull(schema.organizations.googleCalendarId)
      )
    );

  for (const org of orgsWithGoogle) {
    try {
      await syncGoogleCalendarEvents(db, org);
    } catch (err) {
      console.error(`Failed to sync Google Calendar events for org ${org.id}:`, err);
    }
  }

  // Publish scheduled events (publishAt <= now, status = draft)
  const now = new Date();
  const toPublish = await db
    .select({ id: schema.events.id })
    .from(schema.events)
    .where(
      and(
        eq(schema.events.status, "draft"),
        isNotNull(schema.events.publishAt),
        lte(schema.events.publishAt, now)
      )
    );
  for (const evt of toPublish) {
    await db
      .update(schema.events)
      .set({ status: "published", updatedAt: new Date() })
      .where(eq(schema.events.id, evt.id));
  }

  // Check for expiring Facebook tokens (within 7 days)
  const expiringOrgs = await db
    .select()
    .from(schema.organizations)
    .where(
      and(
        isNotNull(schema.organizations.fbTokenExpiresAt),
        lt(
          schema.organizations.fbTokenExpiresAt,
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        )
      )
    );

  if (expiringOrgs.length > 0) {
    console.warn(
      `${expiringOrgs.length} org(s) have expiring Facebook tokens:`,
      expiringOrgs.map((o) => o.name)
    );
    // TODO: Send SES email notification to admins
  }

  // Geocode events that have an address but no coordinates (batch of 10 per run)
  let geocoded = 0;
  try {
    const eventsNeedingGeocode = await db
      .select({ id: schema.events.id, address: schema.events.address, venueName: schema.events.venueName })
      .from(schema.events)
      .where(
        and(
          isNull(schema.events.latitude),
          or(isNotNull(schema.events.address), isNotNull(schema.events.venueName))
        )
      )
      .limit(10);

    for (const evt of eventsNeedingGeocode) {
      const query = evt.address || evt.venueName || "";
      if (!query) continue;
      try {
        const params = new URLSearchParams({ q: query, format: "json", limit: "1", countrycodes: "us" });
        const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
          headers: { "User-Agent": "CasperEventsCalendar/1.0", "Accept-Language": "en" },
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
          const data = (await res.json()) as { lat: string; lon: string }[];
          if (data.length > 0) {
            await db.update(schema.events).set({
              latitude: parseFloat(data[0].lat),
              longitude: parseFloat(data[0].lon),
            }).where(eq(schema.events.id, evt.id));
            geocoded++;
          }
        }
        await new Promise((r) => setTimeout(r, 1100));
      } catch {
        // geocoding is best-effort
      }
    }
  } catch (err) {
    console.error("Geocode backfill error:", err);
  }

  return {
    synced: orgsWithFb.length,
    icalSynced: orgsWithIcal.length,
    googleSynced: orgsWithGoogle.length,
    geocoded,
  };
}

async function syncFacebookEvents(
  db: Awaited<ReturnType<typeof getDb>>,
  org: typeof schema.organizations.$inferSelect
) {
  const url =
    `https://graph.facebook.com/v21.0/${org.facebookPageId}/events` +
    `?access_token=${org.facebookPageToken}` +
    `&fields=id,name,description,start_time,end_time,place,cover` +
    `&since=${Math.floor(Date.now() / 1000)}`;

  const res = await fetch(url);
  const data = (await res.json()) as {
    data?: {
      id: string;
      name: string;
      description?: string;
      start_time: string;
      end_time?: string;
      place?: { name?: string; location?: { street?: string } };
      cover?: { source?: string };
    }[];
  };

  if (!data.data) return;

  for (const fbEvent of data.data) {
    const existing = await db
      .select({ id: schema.events.id })
      .from(schema.events)
      .where(eq(schema.events.facebookEventId, fbEvent.id));

    if (existing.length > 0) continue;

    await db.insert(schema.events).values({
      orgId: org.id,
      title: fbEvent.name,
      description: fbEvent.description || null,
      startAt: new Date(fbEvent.start_time),
      endAt: fbEvent.end_time ? new Date(fbEvent.end_time) : null,
      venueName: fbEvent.place?.name || null,
      address: fbEvent.place?.location?.street || null,
      imageUrl: fbEvent.cover?.source || null,
      facebookEventId: fbEvent.id,
      source: "facebook_import",
      status: "published",
    });
  }
}

async function syncIcalEvents(
  db: Awaited<ReturnType<typeof getDb>>,
  org: typeof schema.organizations.$inferSelect
) {
  if (!org.icalFeedUrl) return;

  const res = await fetch(org.icalFeedUrl);
  const icalText = await res.text();

  // Dynamic import for node-ical (ESM compatibility)
  const ical = await import("node-ical");
  const parsed = ical.parseICS(icalText);

  for (const [uid, component] of Object.entries(parsed)) {
    if (component.type !== "VEVENT") continue;

    const vevent = component as {
      uid: string;
      summary: string;
      description?: string;
      start: Date;
      end?: Date;
      location?: string;
    };

    const existing = await db
      .select({ id: schema.events.id })
      .from(schema.events)
      .where(
        and(
          eq(schema.events.orgId, org.id),
          eq(schema.events.source, "ical_import"),
          eq(schema.events.title, vevent.summary)
        )
      );

    if (existing.length > 0) continue;

    await db.insert(schema.events).values({
      orgId: org.id,
      title: vevent.summary,
      description: vevent.description || null,
      startAt: vevent.start,
      endAt: vevent.end || null,
      address: vevent.location || null,
      source: "ical_import",
      status: "published",
    });
  }
}
