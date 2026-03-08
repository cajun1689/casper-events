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
    let orgCategoriesMap: Record<string, { id: string; name: string; slug: string; icon: string | null; color: string | null; parentCategoryId: string; parentCategorySlug: string }[]> = {};

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

      const eocRows = await db
        .select({
          eventId: schema.eventOrgCategories.eventId,
          orgCat: schema.orgCategories,
          parentSlug: schema.categories.slug,
        })
        .from(schema.eventOrgCategories)
        .innerJoin(
          schema.orgCategories,
          eq(schema.eventOrgCategories.orgCategoryId, schema.orgCategories.id)
        )
        .innerJoin(
          schema.categories,
          eq(schema.orgCategories.parentCategoryId, schema.categories.id)
        )
        .where(inArray(schema.eventOrgCategories.eventId, eventIds));

      for (const row of eocRows) {
        if (!orgCategoriesMap[row.eventId]) orgCategoriesMap[row.eventId] = [];
        orgCategoriesMap[row.eventId].push({
          id: row.orgCat.id,
          name: row.orgCat.name,
          slug: row.orgCat.slug,
          icon: row.orgCat.icon,
          color: row.orgCat.color,
          parentCategoryId: row.orgCat.parentCategoryId,
          parentCategorySlug: row.parentSlug,
        });
      }
    }

    const allOrgIds = [...new Set(events.map((e) => e.orgId))];
    const orgsMap: Record<string, { name: string; slug: string; logoUrl: string | null; status: string }> = {};
    if (allOrgIds.length > 0) {
      const orgs = await db
        .select({ id: schema.organizations.id, name: schema.organizations.name, slug: schema.organizations.slug, logoUrl: schema.organizations.logoUrl, status: schema.organizations.status })
        .from(schema.organizations)
        .where(inArray(schema.organizations.id, allOrgIds));
      for (const org of orgs) orgsMap[org.id] = { name: org.name, slug: org.slug, logoUrl: org.logoUrl, status: org.status };
    }

    let sponsorsMap: Record<string, { name: string; logoUrl: string | null; websiteUrl: string | null; level: string }[]> = {};
    if (eventIds.length > 0) {
      const sponsorRows = await db
        .select()
        .from(schema.eventSponsors)
        .where(inArray(schema.eventSponsors.eventId, eventIds))
        .orderBy(asc(schema.eventSponsors.sortOrder));
      for (const row of sponsorRows) {
        if (!sponsorsMap[row.eventId]) sponsorsMap[row.eventId] = [];
        sponsorsMap[row.eventId].push({
          name: row.name,
          logoUrl: row.logoUrl,
          websiteUrl: row.websiteUrl,
          level: row.level,
        });
      }
    }

    const activeEvents = events.filter((e) => {
      const org = orgsMap[e.orgId];
      return org && org.status === "active";
    });

    let result = activeEvents.map((e) => ({
      ...e,
      startAt: e.startAt.toISOString(),
      endAt: e.endAt?.toISOString() ?? null,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
      categories: categoriesMap[e.id] || [],
      orgCategories: orgCategoriesMap[e.id] || [],
      organization: orgsMap[e.orgId] ? { name: orgsMap[e.orgId].name, slug: orgsMap[e.orgId].slug, logoUrl: orgsMap[e.orgId].logoUrl } : null,
      color: e.color ?? null,
      subtitle: e.subtitle ?? null,
      externalUrl: e.externalUrl ?? null,
      externalUrlText: e.externalUrlText ?? null,
      externalUrlCaption: e.externalUrlCaption ?? null,
      recurrenceRule: e.recurrenceRule ?? null,
      featured: e.featured ?? false,
      sponsors: sponsorsMap[e.id] || [],
    }));

    if (catFilter) {
      const slugs = catFilter.split(",");
      result = result.filter((e) =>
        e.categories.some((c) => slugs.includes(c.slug)) ||
        (e.orgCategories ?? []).some((oc) => slugs.includes(oc.slug))
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
