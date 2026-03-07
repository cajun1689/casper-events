import { FastifyInstance } from "fastify";
import { eq, and, inArray } from "drizzle-orm";
import * as schema from "@cyh/shared/db";
import { createSponsorSchema, updateSponsorSchema } from "@cyh/shared";
import { getDb } from "../db/connection.js";
import { requireAuth } from "../middleware/auth.js";
import { resolveUserOrg } from "../services/user-org.js";

export async function sponsorRoutes(app: FastifyInstance) {
  // List sponsors for an event (public)
  app.get("/:eventId/sponsors", async (request, reply) => {
    const { eventId } = request.params as { eventId: string };
    const db = await getDb();

    const [event] = await db
      .select()
      .from(schema.events)
      .where(eq(schema.events.id, eventId));

    if (!event) {
      return reply.status(404).send({ error: "Event not found" });
    }

    const sponsors = await db
      .select()
      .from(schema.eventSponsors)
      .where(eq(schema.eventSponsors.eventId, eventId))
      .orderBy(schema.eventSponsors.sortOrder);

    return reply.send({
      data: sponsors.map((s) => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
      })),
    });
  });

  // Add sponsor (auth required)
  app.post(
    "/:eventId/sponsors",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { eventId } = request.params as { eventId: string };
      const body = createSponsorSchema.parse(request.body);
      const db = await getDb();
      const userOrg = await resolveUserOrg(db, request.user!.sub);

      const [event] = await db
        .select()
        .from(schema.events)
        .where(eq(schema.events.id, eventId));

      if (!event) {
        return reply.status(404).send({ error: "Event not found" });
      }

      if (!userOrg?.isAdmin && event.orgId !== userOrg?.orgId) {
        return reply.status(403).send({ error: "Not authorized" });
      }

      const [sponsor] = await db
        .insert(schema.eventSponsors)
        .values({ ...body, eventId })
        .returning();

      return reply.status(201).send({
        ...sponsor,
        createdAt: sponsor.createdAt.toISOString(),
      });
    }
  );

  // Update sponsor (auth required)
  app.put(
    "/:eventId/sponsors/:id",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { eventId, id } = request.params as { eventId: string; id: string };
      const body = updateSponsorSchema.parse(request.body);
      const db = await getDb();
      const userOrg = await resolveUserOrg(db, request.user!.sub);

      const [event] = await db
        .select()
        .from(schema.events)
        .where(eq(schema.events.id, eventId));

      if (!event) {
        return reply.status(404).send({ error: "Event not found" });
      }

      if (!userOrg?.isAdmin && event.orgId !== userOrg?.orgId) {
        return reply.status(403).send({ error: "Not authorized" });
      }

      const [existing] = await db
        .select()
        .from(schema.eventSponsors)
        .where(
          and(
            eq(schema.eventSponsors.id, id),
            eq(schema.eventSponsors.eventId, eventId)
          )
        );

      if (!existing) {
        return reply.status(404).send({ error: "Sponsor not found" });
      }

      const [updated] = await db
        .update(schema.eventSponsors)
        .set(body)
        .where(eq(schema.eventSponsors.id, id))
        .returning();

      return reply.send({
        ...updated,
        createdAt: updated.createdAt.toISOString(),
      });
    }
  );

  // Delete sponsor (auth required)
  app.delete(
    "/:eventId/sponsors/:id",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { eventId, id } = request.params as { eventId: string; id: string };
      const db = await getDb();
      const userOrg = await resolveUserOrg(db, request.user!.sub);

      const [event] = await db
        .select()
        .from(schema.events)
        .where(eq(schema.events.id, eventId));

      if (!event) {
        return reply.status(404).send({ error: "Event not found" });
      }

      if (!userOrg?.isAdmin && event.orgId !== userOrg?.orgId) {
        return reply.status(403).send({ error: "Not authorized" });
      }

      const [existing] = await db
        .select()
        .from(schema.eventSponsors)
        .where(
          and(
            eq(schema.eventSponsors.id, id),
            eq(schema.eventSponsors.eventId, eventId)
          )
        );

      if (!existing) {
        return reply.status(404).send({ error: "Sponsor not found" });
      }

      await db
        .delete(schema.eventSponsors)
        .where(eq(schema.eventSponsors.id, id));

      return reply.status(204).send();
    }
  );

  // Reorder sponsors (auth required)
  app.put(
    "/:eventId/sponsors/reorder",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { eventId } = request.params as { eventId: string };
      const body = request.body as { order: { id: string; sortOrder: number }[] };
      const db = await getDb();
      const userOrg = await resolveUserOrg(db, request.user!.sub);

      const [event] = await db
        .select()
        .from(schema.events)
        .where(eq(schema.events.id, eventId));

      if (!event) {
        return reply.status(404).send({ error: "Event not found" });
      }

      if (!userOrg?.isAdmin && event.orgId !== userOrg?.orgId) {
        return reply.status(403).send({ error: "Not authorized" });
      }

      if (!Array.isArray(body.order) || body.order.length === 0) {
        return reply.status(400).send({ error: "order must be a non-empty array of { id, sortOrder }" });
      }

      const sponsorIds = body.order.map((o) => o.id);
      const sponsors = await db
        .select()
        .from(schema.eventSponsors)
        .where(
          and(
            eq(schema.eventSponsors.eventId, eventId),
            inArray(schema.eventSponsors.id, sponsorIds)
          )
        );

      if (sponsors.length !== sponsorIds.length) {
        return reply.status(400).send({ error: "Some sponsor IDs are invalid" });
      }

      const orderMap = new Map(body.order.map((o) => [o.id, o.sortOrder]));
      for (const sponsor of sponsors) {
        const sortOrder = orderMap.get(sponsor.id);
        if (sortOrder !== undefined) {
          await db
            .update(schema.eventSponsors)
            .set({ sortOrder })
            .where(eq(schema.eventSponsors.id, sponsor.id));
        }
      }

      const updated = await db
        .select()
        .from(schema.eventSponsors)
        .where(eq(schema.eventSponsors.eventId, eventId))
        .orderBy(schema.eventSponsors.sortOrder);

      return reply.send({
        data: updated.map((s) => ({
          ...s,
          createdAt: s.createdAt.toISOString(),
        })),
      });
    }
  );
}
