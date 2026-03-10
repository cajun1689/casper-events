import "dotenv/config";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { getDb } from "./db/connection.js";
import { eq, and, gte, lte, inArray } from "drizzle-orm";
import * as schema from "@cyh/shared/db";

const ses = new SESClient({ region: process.env.AWS_REGION || "us-east-1" });
const FROM_EMAIL = process.env.DIGEST_FROM_EMAIL || "noreply@casperevents.org";
const WEB_URL = process.env.WEB_URL || "https://casperevents.org";
const API_URL = process.env.API_URL || "https://api.casperevents.org/v1";

export async function handler() {
  const db = await getDb();

  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const events = await db
    .select({
      id: schema.events.id,
      title: schema.events.title,
      startAt: schema.events.startAt,
      endAt: schema.events.endAt,
      allDay: schema.events.allDay,
      venueName: schema.events.venueName,
      address: schema.events.address,
    })
    .from(schema.events)
    .innerJoin(
      schema.organizations,
      eq(schema.events.orgId, schema.organizations.id)
    )
    .where(
      and(
        inArray(schema.events.status, ["published", "approved"]),
        eq(schema.organizations.status, "active"),
        gte(schema.events.startAt, now),
        lte(schema.events.startAt, weekFromNow)
      )
    )
    .orderBy(schema.events.startAt);

  const eventIds = events.map((e) => e.id);
  let categoriesMap: Record<string, { name: string; slug: string }[]> = {};
  if (eventIds.length > 0) {
    const ecRows = await db
      .select({
        eventId: schema.eventCategories.eventId,
        name: schema.categories.name,
        slug: schema.categories.slug,
      })
      .from(schema.eventCategories)
      .innerJoin(
        schema.categories,
        eq(schema.eventCategories.categoryId, schema.categories.id)
      )
      .where(inArray(schema.eventCategories.eventId, eventIds));
    for (const row of ecRows) {
      if (!categoriesMap[row.eventId]) categoriesMap[row.eventId] = [];
      categoriesMap[row.eventId].push({ name: row.name, slug: row.slug });
    }
  }

  const subscribers = await db
    .select()
    .from(schema.digestSubscribers)
    .where(eq(schema.digestSubscribers.active, true));

  if (subscribers.length === 0 || events.length === 0) {
    return { sent: 0, subscribers: subscribers.length, events: events.length };
  }

  const eventsByDay = new Map<string, typeof events>();
  for (const event of events) {
    const day = event.startAt.toISOString().slice(0, 10);
    const list = eventsByDay.get(day) ?? [];
    list.push(event);
    eventsByDay.set(day, list);
  }

  const digestSettings = await loadDigestSettings(db);
  const html = buildDigestHtml(eventsByDay, categoriesMap, digestSettings);
  const text = buildDigestText(eventsByDay, categoriesMap, digestSettings);

  let sent = 0;
  for (const sub of subscribers) {
    const prefs = (sub.preferences as { categories?: string[] }) ?? {};
    const catFilter = prefs.categories;
    let filteredEvents = events;
    if (catFilter && catFilter.length > 0) {
      filteredEvents = events.filter((e) =>
        (categoriesMap[e.id] ?? []).some((c) => catFilter.includes(c.slug))
      );
    }
    if (filteredEvents.length === 0) continue;

    const subHtml = catFilter?.length
      ? buildDigestHtml(
          groupByDay(filteredEvents),
          categoriesMap,
          digestSettings
        )
      : html;
    const subText = catFilter?.length
      ? buildDigestText(
          groupByDay(filteredEvents),
          categoriesMap,
          digestSettings
        )
      : text;

    const unsubscribeUrl = `${API_URL}/digest/unsubscribe/${sub.unsubscribeToken}`;

    try {
      await ses.send(
        new SendEmailCommand({
          Source: FROM_EMAIL,
          Destination: { ToAddresses: [sub.email] },
          Message: {
            Subject: {
              Data: `This week's events – ${filteredEvents.length} upcoming`,
              Charset: "UTF-8",
            },
            Body: {
              Html: {
                Data: subHtml.replace(
                  "{{UNSUBSCRIBE_URL}}",
                  unsubscribeUrl
                ),
                Charset: "UTF-8",
              },
              Text: {
                Data: subText + `\n\nUnsubscribe: ${unsubscribeUrl}`,
                Charset: "UTF-8",
              },
            },
          },
        })
      );
      sent++;
    } catch (err) {
      console.error(`Failed to send digest to ${sub.email}:`, err);
    }
  }

  return { sent, subscribers: subscribers.length, events: events.length };
}

interface DigestSettings {
  emailHeader: string;
  emailFooter: string;
  headerImageUrl: string;
  sponsors: { name: string; url: string; logoUrl?: string }[];
  extraLinks: { label: string; url: string }[];
}

async function loadDigestSettings(db: Awaited<ReturnType<typeof getDb>>): Promise<DigestSettings> {
  const [row] = await db
    .select()
    .from(schema.appSettings)
    .where(eq(schema.appSettings.key, "digest_settings"));
  const defaultSettings: DigestSettings = {
    emailHeader: "",
    emailFooter: "",
    headerImageUrl: "",
    sponsors: [],
    extraLinks: [],
  };
  if (!row?.value) return defaultSettings;
  try {
    return { ...defaultSettings, ...JSON.parse(row.value) };
  } catch {
    return defaultSettings;
  }
}

function groupByDay(
  events: { startAt: Date }[]
): Map<string, typeof events> {
  const map = new Map<string, typeof events>();
  for (const e of events) {
    const day = e.startAt.toISOString().slice(0, 10);
    const list = map.get(day) ?? [];
    list.push(e);
    map.set(day, list);
  }
  return map;
}

function buildDigestHtml(
  eventsByDay: Map<string, { id: string; title: string; startAt: Date; endAt: Date | null; allDay: boolean; venueName: string | null; address: string | null }[]>,
  categoriesMap: Record<string, { name: string; slug: string }[]>,
  settings: DigestSettings
): string {
  const days = Array.from(eventsByDay.entries()).sort(([a], [b]) => a.localeCompare(b));
  let body = "";
  for (const [day, dayEvents] of days) {
    const dateStr = new Date(day + "T12:00:00").toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    body += `<h2 style="margin:24px 0 12px;font-size:18px;color:#1f2937">${dateStr}</h2>`;
    for (const e of dayEvents) {
      const timeStr = e.allDay
        ? "All day"
        : e.startAt.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          });
      const cats = (categoriesMap[e.id] ?? []).map((c) => c.name).join(", ");
      body += `
        <div style="margin-bottom:16px;padding:12px;background:#f9fafb;border-radius:8px">
          <a href="${WEB_URL}/events/${e.id}" style="font-weight:600;color:#4f46e5;text-decoration:none">${escapeHtml(e.title)}</a>
          <div style="font-size:13px;color:#6b7280;margin-top:4px">${timeStr}${e.venueName ? ` · ${escapeHtml(e.venueName)}` : ""}</div>
          ${cats ? `<div style="font-size:12px;color:#9ca3af;margin-top:2px">${escapeHtml(cats)}</div>` : ""}
        </div>`;
    }
  }

  const headerImg = settings.headerImageUrl?.trim()
    ? `<img src="${escapeHtml(settings.headerImageUrl)}" alt="" style="max-width:100%;height:auto;display:block;margin-bottom:24px" />`
    : "";
  const customHeader = settings.emailHeader?.trim() ? `<div style="margin-bottom:24px">${settings.emailHeader}</div>` : "";
  const customFooter = settings.emailFooter?.trim() ? `<div style="margin-top:24px">${settings.emailFooter}</div>` : "";

  let sponsorsHtml = "";
  if (settings.sponsors?.length) {
    sponsorsHtml = `<div style="margin-top:32px;padding-top:24px;border-top:1px solid #e5e7eb">
      <p style="font-size:12px;color:#6b7280;margin-bottom:12px">Our sponsors</p>
      <div style="display:flex;flex-wrap:wrap;gap:16px;align-items:center">`;
    for (const s of settings.sponsors) {
      if (s.logoUrl?.trim()) {
        sponsorsHtml += `<a href="${escapeHtml(s.url || "#")}" style="display:block"><img src="${escapeHtml(s.logoUrl)}" alt="${escapeHtml(s.name)}" style="max-height:40px;width:auto" /></a>`;
      } else {
        sponsorsHtml += `<a href="${escapeHtml(s.url || "#")}" style="font-size:13px;color:#4f46e5;text-decoration:none">${escapeHtml(s.name)}</a>`;
      }
    }
    sponsorsHtml += `</div></div>`;
  }

  let extraLinksHtml = "";
  if (settings.extraLinks?.length) {
    extraLinksHtml = `<div style="margin-top:16px;font-size:13px">
      ${settings.extraLinks.map((l) => `<a href="${escapeHtml(l.url)}" style="color:#4f46e5;text-decoration:none;margin-right:16px">${escapeHtml(l.label)}</a>`).join("")}
    </div>`;
  }

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Weekly Events</title></head>
<body style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1f2937">
  ${headerImg}
  ${customHeader}
  <h1 style="font-size:24px;margin-bottom:8px">This week's events</h1>
  <p style="color:#6b7280;margin-bottom:24px">Here are the upcoming events in your community.</p>
  ${body}
  ${customFooter}
  ${sponsorsHtml}
  ${extraLinksHtml}
  <p style="margin-top:32px;font-size:12px;color:#9ca3af">
    <a href="{{UNSUBSCRIBE_URL}}" style="color:#9ca3af">Unsubscribe</a> from this digest
  </p>
</body>
</html>`;
}

function buildDigestText(
  eventsByDay: Map<string, { id: string; title: string; startAt: Date; endAt: Date | null; allDay: boolean; venueName: string | null; address: string | null }[]>,
  categoriesMap: Record<string, { name: string; slug: string }[]>,
  _settings: DigestSettings
): string {
  const days = Array.from(eventsByDay.entries()).sort(([a], [b]) => a.localeCompare(b));
  let lines: string[] = ["This week's events", ""];
  for (const [day, dayEvents] of days) {
    const dateStr = new Date(day + "T12:00:00").toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    lines.push(dateStr);
    lines.push("");
    for (const e of dayEvents) {
      const timeStr = e.allDay
        ? "All day"
        : e.startAt.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          });
      lines.push(`- ${e.title}`);
      lines.push(`  ${timeStr}${e.venueName ? ` · ${e.venueName}` : ""}`);
      lines.push(`  ${WEB_URL}/events/${e.id}`);
      lines.push("");
    }
  }
  return lines.join("\n");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
