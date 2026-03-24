import "dotenv/config";
import { getDb } from "./db/connection.js";
import { eq, and, gte, lte, inArray } from "drizzle-orm";
import * as schema from "@cyh/shared/db";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
}

async function sendExpoPush(messages: ExpoMessage[]): Promise<void> {
  if (messages.length === 0) return;

  const res = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(messages),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Expo Push API error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { data?: { status: string }[] };
  if (data.data) {
    for (let i = 0; i < data.data.length; i++) {
      const status = data.data[i]?.status;
      if (status === "error") {
        console.warn(`Push to ${messages[i]?.to} failed`);
      }
    }
  }
}

export async function handler() {
  const db = await getDb();

  const now = new Date();
  const windowStart = new Date(now.getTime() + 90 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 91 * 60 * 1000);

  const events = await db
    .select({
      id: schema.events.id,
      title: schema.events.title,
      startAt: schema.events.startAt,
      venueName: schema.events.venueName,
      orgId: schema.events.orgId,
    })
    .from(schema.events)
    .where(
      and(
        inArray(schema.events.status, ["published", "approved"]),
        gte(schema.events.startAt, windowStart),
        lte(schema.events.startAt, windowEnd)
      )
    );

  const messages: ExpoMessage[] = [];
  const seenTokens = new Set<string>();

  for (const event of events) {
    const subs = await db
      .select({
        token: schema.pushSubscriptions.expoPushToken,
      })
      .from(schema.pushSubscriptionOrgs)
      .innerJoin(
        schema.pushSubscriptions,
        eq(
          schema.pushSubscriptionOrgs.subscriptionId,
          schema.pushSubscriptions.id
        )
      )
      .where(eq(schema.pushSubscriptionOrgs.orgId, event.orgId));

    const timeStr = new Date(event.startAt).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const whereStr = event.venueName ? ` at ${event.venueName}` : "";

    for (const sub of subs) {
      if (seenTokens.has(sub.token)) continue;
      seenTokens.add(sub.token);

      messages.push({
        to: sub.token,
        title: event.title,
        body: `Starts in 1.5 hours (${timeStr})${whereStr}`,
        data: { eventId: event.id, url: `wyomingevents://events/${event.id}` },
        sound: "default",
      });
    }
  }

  if (messages.length > 0) {
    await sendExpoPush(messages);
    console.log(`Sent ${messages.length} push notifications for ${events.length} events`);
  }
}
