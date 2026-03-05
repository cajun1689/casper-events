import { FastifyInstance } from "fastify";
import { eq, and, or, inArray, gte, asc } from "drizzle-orm";
import * as schema from "@cyh/shared/db";
import { createEmbedConfigSchema, updateEmbedConfigSchema } from "@cyh/shared";
import { getDb } from "../db/connection.js";
import { requireAuth } from "../middleware/auth.js";
import { resolveUserOrg } from "../services/user-org.js";

export async function embedRoutes(app: FastifyInstance) {
  // Get embed config (public -- the widget calls this)
  app.get("/embed/config/:orgId", async (request, reply) => {
    const { orgId } = request.params as { orgId: string };
    const db = await getDb();

    const configs = await db
      .select()
      .from(schema.embedConfigs)
      .where(eq(schema.embedConfigs.orgId, orgId));

    if (configs.length === 0) {
      return reply.status(404).send({ error: "Embed config not found" });
    }

    return reply.send({ data: configs });
  });

  // Get events for embed (public endpoint)
  // Returns events for the org + optionally connected orgs
  app.get("/embed/events/:orgId", async (request, reply) => {
    const { orgId } = request.params as { orgId: string };
    const { includeConnected, categories: catFilter } = request.query as {
      includeConnected?: string;
      categories?: string;
    };
    const db = await getDb();

    let orgIds = [orgId];

    if (includeConnected === "true") {
      const connections = await db
        .select()
        .from(schema.orgConnections)
        .where(
          and(
            or(
              eq(schema.orgConnections.orgId, orgId),
              eq(schema.orgConnections.connectedOrgId, orgId)
            ),
            eq(schema.orgConnections.status, "accepted")
          )
        );

      const connectedIds = connections.map((c) =>
        c.orgId === orgId ? c.connectedOrgId : c.orgId
      );
      orgIds = [...orgIds, ...connectedIds];
    }

    const events = await db
      .select()
      .from(schema.events)
      .where(
        and(
          inArray(schema.events.orgId, orgIds),
          inArray(schema.events.status, ["published", "approved"]),
          gte(schema.events.startAt, new Date())
        )
      )
      .orderBy(asc(schema.events.startAt))
      .limit(100);

    const eventIds = events.map((e) => e.id);
    let categoriesMap: Record<string, { id: string; name: string; slug: string; icon: string | null; color: string | null }[]> = {};

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
        categoriesMap[row.eventId].push({
          id: row.category.id,
          name: row.category.name,
          slug: row.category.slug,
          icon: row.category.icon,
          color: row.category.color,
        });
      }
    }

    let result = events.map((e) => ({
      ...e,
      startAt: e.startAt.toISOString(),
      endAt: e.endAt?.toISOString() ?? null,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
      categories: categoriesMap[e.id] || [],
    }));

    if (catFilter) {
      const slugs = catFilter.split(",");
      result = result.filter((e) =>
        e.categories.some((c) => slugs.includes(c.slug))
      );
    }

    return reply.send({ data: result });
  });

  // Update embed config
  app.put(
    "/embed/config/:id",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = updateEmbedConfigSchema.parse(request.body);
      const db = await getDb();
      const userOrg = await resolveUserOrg(db, request.user!.sub);

      const [existing] = await db
        .select()
        .from(schema.embedConfigs)
        .where(eq(schema.embedConfigs.id, id));

      if (!existing) {
        return reply.status(404).send({ error: "Embed config not found" });
      }

      if (userOrg?.orgId !== existing.orgId && !userOrg?.isAdmin) {
        return reply.status(403).send({ error: "Not authorized" });
      }

      const [updated] = await db
        .update(schema.embedConfigs)
        .set(body)
        .where(eq(schema.embedConfigs.id, id))
        .returning();

      return reply.send(updated);
    }
  );

  // Create additional embed config
  app.post(
    "/embed/config",
    { preHandler: requireAuth },
    async (request, reply) => {
      const body = createEmbedConfigSchema.parse(request.body);
      const db = await getDb();
      const userOrg = await resolveUserOrg(db, request.user!.sub);

      if (!userOrg) {
        return reply.status(403).send({ error: "Not authorized" });
      }

      const [config] = await db
        .insert(schema.embedConfigs)
        .values({ ...body, orgId: userOrg.orgId })
        .returning();

      return reply.status(201).send(config);
    }
  );
}
