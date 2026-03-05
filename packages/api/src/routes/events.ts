import { FastifyInstance } from "fastify";
import { eq, and, gte, lte, inArray, sql, ilike, desc, asc, SQL } from "drizzle-orm";
import * as schema from "@cyh/shared/db";
import {
  createEventSchema,
  updateEventSchema,
  listEventsSchema,
} from "@cyh/shared";
import { getDb } from "../db/connection.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import { resolveUserOrg } from "../services/user-org.js";

export async function eventRoutes(app: FastifyInstance) {
  // List events (public, with filters)
  app.get("/events", { preHandler: optionalAuth }, async (request, reply) => {
    const query = listEventsSchema.parse(request.query);
    const db = await getDb();

    const conditions: SQL[] = [];

    if (query.status) {
      conditions.push(eq(schema.events.status, query.status));
    } else {
      conditions.push(
        inArray(schema.events.status, ["published", "approved"])
      );
    }

    if (query.orgId) {
      conditions.push(eq(schema.events.orgId, query.orgId));
    }

    if (query.startAfter) {
      conditions.push(gte(schema.events.startAt, new Date(query.startAfter)));
    }

    if (query.startBefore) {
      conditions.push(lte(schema.events.startAt, new Date(query.startBefore)));
    }

    if (query.search) {
      conditions.push(ilike(schema.events.title, `%${query.search}%`));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const offset = (query.page - 1) * query.limit;

    const [eventsResult, countResult] = await Promise.all([
      db
        .select()
        .from(schema.events)
        .where(where)
        .orderBy(asc(schema.events.startAt))
        .limit(query.limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(schema.events)
        .where(where),
    ]);

    const total = Number(countResult[0].count);
    const eventIds = eventsResult.map((e) => e.id);

    let categoriesMap: Record<string, typeof schema.categories.$inferSelect[]> = {};
    let orgsMap: Record<string, typeof schema.organizations.$inferSelect> = {};

    if (eventIds.length > 0) {
      const ecRows = await db
        .select({
          eventId: schema.eventCategories.eventId,
          category: schema.categories,
        })
        .from(schema.eventCategories)
        .innerJoin(
          schema.categories,
          eq(schema.eventCategories.categoryId, schema.categories.id)
        )
        .where(inArray(schema.eventCategories.eventId, eventIds));

      for (const row of ecRows) {
        if (!categoriesMap[row.eventId]) categoriesMap[row.eventId] = [];
        categoriesMap[row.eventId].push(row.category);
      }

      const orgIds = [...new Set(eventsResult.map((e) => e.orgId))];
      const orgs = await db
        .select()
        .from(schema.organizations)
        .where(inArray(schema.organizations.id, orgIds));

      for (const org of orgs) {
        orgsMap[org.id] = org;
      }
    }

    // Category filtering (post-query since it's a join table)
    let filteredEvents = eventsResult;
    if (query.categories && query.categories.length > 0) {
      const catSlugs = query.categories;
      filteredEvents = eventsResult.filter((event) => {
        const cats = categoriesMap[event.id] || [];
        return cats.some((c) => catSlugs.includes(c.slug));
      });
    }

    const data = filteredEvents.map((event) => ({
      ...event,
      startAt: event.startAt.toISOString(),
      endAt: event.endAt?.toISOString() ?? null,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
      organization: orgsMap[event.orgId]
        ? {
            id: orgsMap[event.orgId].id,
            name: orgsMap[event.orgId].name,
            slug: orgsMap[event.orgId].slug,
            logoUrl: orgsMap[event.orgId].logoUrl,
          }
        : null,
      categories: (categoriesMap[event.id] || []).map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        icon: c.icon,
        color: c.color,
      })),
    }));

    return reply.send({
      data,
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    });
  });

  // Get single event
  app.get("/events/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const db = await getDb();

    const [event] = await db
      .select()
      .from(schema.events)
      .where(eq(schema.events.id, id));

    if (!event) {
      return reply.status(404).send({ error: "Event not found" });
    }

    const [org] = await db
      .select()
      .from(schema.organizations)
      .where(eq(schema.organizations.id, event.orgId));

    const ecRows = await db
      .select({ category: schema.categories })
      .from(schema.eventCategories)
      .innerJoin(
        schema.categories,
        eq(schema.eventCategories.categoryId, schema.categories.id)
      )
      .where(eq(schema.eventCategories.eventId, id));

    return reply.send({
      ...event,
      startAt: event.startAt.toISOString(),
      endAt: event.endAt?.toISOString() ?? null,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
      organization: org
        ? { id: org.id, name: org.name, slug: org.slug, logoUrl: org.logoUrl }
        : null,
      categories: ecRows.map((r) => ({
        id: r.category.id,
        name: r.category.name,
        slug: r.category.slug,
        icon: r.category.icon,
        color: r.category.color,
      })),
    });
  });

  // Create event
  app.post(
    "/events",
    { preHandler: requireAuth },
    async (request, reply) => {
      const body = createEventSchema.parse(request.body);
      const db = await getDb();
      const userOrg = await resolveUserOrg(db, request.user!.sub);

      if (!userOrg) {
        return reply
          .status(403)
          .send({ error: "You must belong to an organization to create events" });
      }

      const { categoryIds, ...eventData } = body;

      const [event] = await db
        .insert(schema.events)
        .values({
          ...eventData,
          startAt: new Date(eventData.startAt),
          endAt: eventData.endAt ? new Date(eventData.endAt) : null,
          orgId: userOrg.orgId,
          status: "published",
        })
        .returning();

      if (categoryIds.length > 0) {
        await db.insert(schema.eventCategories).values(
          categoryIds.map((categoryId) => ({
            eventId: event.id,
            categoryId,
          }))
        );
      }

      return reply.status(201).send({
        ...event,
        startAt: event.startAt.toISOString(),
        endAt: event.endAt?.toISOString() ?? null,
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
      });
    }
  );

  // Update event
  app.put(
    "/events/:id",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = updateEventSchema.parse(request.body);
      const db = await getDb();
      const userOrg = await resolveUserOrg(db, request.user!.sub);

      const [existing] = await db
        .select()
        .from(schema.events)
        .where(eq(schema.events.id, id));

      if (!existing) {
        return reply.status(404).send({ error: "Event not found" });
      }

      if (!userOrg?.isAdmin && existing.orgId !== userOrg?.orgId) {
        return reply.status(403).send({ error: "Not authorized" });
      }

      const { categoryIds, ...eventData } = body;

      const updateData: Record<string, unknown> = { ...eventData, updatedAt: new Date() };
      if (eventData.startAt) updateData.startAt = new Date(eventData.startAt);
      if (eventData.endAt) updateData.endAt = new Date(eventData.endAt);

      const [updated] = await db
        .update(schema.events)
        .set(updateData)
        .where(eq(schema.events.id, id))
        .returning();

      if (categoryIds !== undefined) {
        await db
          .delete(schema.eventCategories)
          .where(eq(schema.eventCategories.eventId, id));

        if (categoryIds.length > 0) {
          await db.insert(schema.eventCategories).values(
            categoryIds.map((categoryId) => ({
              eventId: id,
              categoryId,
            }))
          );
        }
      }

      return reply.send({
        ...updated,
        startAt: updated.startAt.toISOString(),
        endAt: updated.endAt?.toISOString() ?? null,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      });
    }
  );

  // Delete event
  app.delete(
    "/events/:id",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const db = await getDb();
      const userOrg = await resolveUserOrg(db, request.user!.sub);

      const [existing] = await db
        .select()
        .from(schema.events)
        .where(eq(schema.events.id, id));

      if (!existing) {
        return reply.status(404).send({ error: "Event not found" });
      }

      if (!userOrg?.isAdmin && existing.orgId !== userOrg?.orgId) {
        return reply.status(403).send({ error: "Not authorized" });
      }

      await db.delete(schema.events).where(eq(schema.events.id, id));
      return reply.status(204).send();
    }
  );
}
