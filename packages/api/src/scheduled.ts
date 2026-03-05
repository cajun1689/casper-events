import { getDb } from "./db/connection.js";
import { eq, and, lt, isNotNull } from "drizzle-orm";
import * as schema from "@cyh/shared/db";

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

  return { synced: orgsWithFb.length, icalSynced: orgsWithIcal.length };
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
