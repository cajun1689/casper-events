import { FastifyInstance } from "fastify";
import { eq, and, inArray, gte, asc } from "drizzle-orm";
import * as schema from "@cyh/shared/db";
import icalGenerator from "ical-generator";
import { getDb } from "../db/connection.js";

export async function icalRoutes(app: FastifyInstance) {
  // iCal feed output -- subscribe to all approved events
  app.get("/events/feed.ics", async (request, reply) => {
    const { orgId, categories: catFilter } = request.query as {
      orgId?: string;
      categories?: string;
    };
    const db = await getDb();

    const conditions = [
      eq(schema.events.status, "approved"),
      gte(schema.events.startAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
    ];

    if (orgId) {
      conditions.push(eq(schema.events.orgId, orgId));
    }

    const events = await db
      .select()
      .from(schema.events)
      .where(and(...conditions))
      .orderBy(asc(schema.events.startAt))
      .limit(500);

    const cal = icalGenerator({
      name: "CYH Community Calendar",
      prodId: { company: "CYH Calendar", product: "Community Events" },
      timezone: "America/Chicago",
    });

    for (const event of events) {
      cal.createEvent({
        id: event.id,
        summary: event.title,
        description: event.description || undefined,
        start: event.startAt,
        end: event.endAt || undefined,
        allDay: event.allDay,
        location: [event.venueName, event.address]
          .filter(Boolean)
          .join(", ") || undefined,
        url: event.ticketUrl || undefined,
      });
    }

    reply.header("Content-Type", "text/calendar; charset=utf-8");
    reply.header(
      "Content-Disposition",
      'attachment; filename="cyh-calendar.ics"'
    );
    return reply.send(cal.toString());
  });
}
