import { FastifyInstance } from "fastify";
import { eq, and, asc } from "drizzle-orm";
import * as schema from "@cyh/shared/db";
import { createOrgCategorySchema, updateOrgCategorySchema } from "@cyh/shared";
import { getDb } from "../db/connection.js";
import { requireAuth } from "../middleware/auth.js";
import { resolveUserOrg } from "../services/user-org.js";

export async function orgCategoryRoutes(app: FastifyInstance) {
  // List org categories (public for embed; used when loading embed config)
  app.get("/organizations/:id/org-categories", async (request, reply) => {
    const { id: orgId } = request.params as { id: string };
    const db = await getDb();

    const rows = await db
      .select({
        orgCat: schema.orgCategories,
        parent: schema.categories,
      })
      .from(schema.orgCategories)
      .innerJoin(
        schema.categories,
        eq(schema.orgCategories.parentCategoryId, schema.categories.id)
      )
      .where(eq(schema.orgCategories.orgId, orgId))
      .orderBy(asc(schema.orgCategories.sortOrder), asc(schema.orgCategories.name));

    const data = rows.map((r) => ({
      ...r.orgCat,
      parentCategory: r.parent
        ? {
            id: r.parent.id,
            name: r.parent.name,
            slug: r.parent.slug,
            icon: r.parent.icon,
            color: r.parent.color,
          }
        : null,
    }));

    return reply.send({ data });
  });

  // Create org category (auth required, org member)
  app.post(
    "/organizations/:id/org-categories",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { id: orgId } = request.params as { id: string };
      const body = createOrgCategorySchema.parse(request.body);
      const db = await getDb();
      const userOrg = await resolveUserOrg(db, request.user!.sub);

      if (userOrg?.orgId !== orgId && !userOrg?.isAdmin) {
        return reply.status(403).send({ error: "Not authorized" });
      }

      // Verify parent category exists
      const [parent] = await db
        .select()
        .from(schema.categories)
        .where(eq(schema.categories.id, body.parentCategoryId));

      if (!parent) {
        return reply.status(400).send({ error: "Parent category not found" });
      }

      // Slug must be unique per org
      const [existing] = await db
        .select()
        .from(schema.orgCategories)
        .where(
          and(
            eq(schema.orgCategories.orgId, orgId),
            eq(schema.orgCategories.slug, body.slug)
          )
        );

      if (existing) {
        return reply.status(409).send({ error: "Slug already used in this org" });
      }

      const [created] = await db
        .insert(schema.orgCategories)
        .values({
          orgId,
          parentCategoryId: body.parentCategoryId,
          name: body.name,
          slug: body.slug,
          icon: body.icon ?? null,
          color: body.color ?? null,
          sortOrder: body.sortOrder ?? 0,
        })
        .returning();

      return reply.status(201).send({
        ...created,
        parentCategory: parent,
      });
    }
  );

  // Update org category
  app.put(
    "/organizations/:id/org-categories/:catId",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { id: orgId, catId } = request.params as { id: string; catId: string };
      const body = updateOrgCategorySchema.parse(request.body);
      const db = await getDb();
      const userOrg = await resolveUserOrg(db, request.user!.sub);

      if (userOrg?.orgId !== orgId && !userOrg?.isAdmin) {
        return reply.status(403).send({ error: "Not authorized" });
      }

      const [existing] = await db
        .select()
        .from(schema.orgCategories)
        .where(
          and(
            eq(schema.orgCategories.id, catId),
            eq(schema.orgCategories.orgId, orgId)
          )
        );

      if (!existing) {
        return reply.status(404).send({ error: "Org category not found" });
      }

      const [updated] = await db
        .update(schema.orgCategories)
        .set(body)
        .where(eq(schema.orgCategories.id, catId))
        .returning();

      return reply.send(updated);
    }
  );

  // Delete org category
  app.delete(
    "/organizations/:id/org-categories/:catId",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { id: orgId, catId } = request.params as { id: string; catId: string };
      const db = await getDb();
      const userOrg = await resolveUserOrg(db, request.user!.sub);

      if (userOrg?.orgId !== orgId && !userOrg?.isAdmin) {
        return reply.status(403).send({ error: "Not authorized" });
      }

      const [existing] = await db
        .select()
        .from(schema.orgCategories)
        .where(
          and(
            eq(schema.orgCategories.id, catId),
            eq(schema.orgCategories.orgId, orgId)
          )
        );

      if (!existing) {
        return reply.status(404).send({ error: "Org category not found" });
      }

      await db
        .delete(schema.orgCategories)
        .where(eq(schema.orgCategories.id, catId));

      return reply.status(204).send();
    }
  );
}
