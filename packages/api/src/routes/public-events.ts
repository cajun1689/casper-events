import { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import * as schema from "@cyh/shared/db";
import { publicEventSubmissionSchema } from "@cyh/shared";
import { getDb } from "../db/connection.js";

export async function publicEventRoutes(app: FastifyInstance) {
  // Submit event (public, no auth)
  app.post("/public/events", async (request, reply) => {
    const body = publicEventSubmissionSchema.parse(request.body);
    const db = await getDb();

    const [communityOrg] = await db
      .select()
      .from(schema.organizations)
      .where(eq(schema.organizations.slug, "community"));

    if (!communityOrg) {
      return reply.status(503).send({
        error: "Public event submission is not configured. Please contact the administrator.",
      });
    }

    const [event] = await db
      .insert(schema.events)
      .values({
        orgId: communityOrg.id,
        title: body.title,
        description: body.description ?? null,
        startAt: new Date(body.startAt),
        endAt: body.endAt ? new Date(body.endAt) : null,
        allDay: body.allDay,
        venueName: body.venueName ?? null,
        address: body.address ?? null,
        cost: body.cost ?? null,
        ticketUrl: body.ticketUrl ?? null,
        status: "draft",
        source: "manual",
        submitterEmail: body.submitterEmail,
        submitterName: body.submitterName,
      })
      .returning();

    if (body.categoryIds.length > 0) {
      await db.insert(schema.eventCategories).values(
        body.categoryIds.map((categoryId) => ({
          eventId: event.id,
          categoryId,
        }))
      );
    }

    return reply.status(201).send({
      success: true,
      message: "Thank you! Your event has been submitted. An administrator will review it and publish it to the calendar.",
      eventId: event.id,
    });
  });
}
