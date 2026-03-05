import { FastifyInstance } from "fastify";
import { eq, inArray, sql, and, desc } from "drizzle-orm";
import * as schema from "@cyh/shared/db";
import { reviewEventSchema, createCategorySchema } from "@cyh/shared";
import { getDb } from "../db/connection.js";
import { requireAuth } from "../middleware/auth.js";
import { resolveUserOrg } from "../services/user-org.js";

async function requireAdmin(
  db: Awaited<ReturnType<typeof getDb>>,
  cognitoSub: string
) {
  const userOrg = await resolveUserOrg(db, cognitoSub);
  if (!userOrg?.isAdmin) {
    throw { statusCode: 403, message: "Admin access required" };
  }
  return userOrg;
}

export async function adminRoutes(app: FastifyInstance) {
  // Review event (approve/reject)
  app.put(
    "/admin/events/:id/review",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = reviewEventSchema.parse(request.body);
      const db = await getDb();
      const admin = await requireAdmin(db, request.user!.sub);

      const [event] = await db
        .select()
        .from(schema.events)
        .where(eq(schema.events.id, id));

      if (!event) {
        return reply.status(404).send({ error: "Event not found" });
      }

      const newStatus = body.decision === "approved" ? "approved" : "rejected";

      await db
        .update(schema.events)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(eq(schema.events.id, id));

      await db.insert(schema.adminReviews).values({
        eventId: id,
        reviewedBy: admin.userId,
        decision: body.decision,
        notes: body.notes,
      });

      return reply.send({ id, status: newStatus, decision: body.decision });
    }
  );

  // Bulk approve
  app.post(
    "/admin/events/bulk-review",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { eventIds, decision, notes } = request.body as {
        eventIds: string[];
        decision: "approved" | "rejected";
        notes?: string;
      };
      const db = await getDb();
      const admin = await requireAdmin(db, request.user!.sub);

      const newStatus = decision === "approved" ? "approved" : "rejected";

      await db
        .update(schema.events)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(inArray(schema.events.id, eventIds));

      await db.insert(schema.adminReviews).values(
        eventIds.map((eventId) => ({
          eventId,
          reviewedBy: admin.userId,
          decision,
          notes,
        }))
      );

      return reply.send({
        reviewed: eventIds.length,
        decision,
      });
    }
  );

  // List events pending review
  app.get(
    "/admin/events/pending",
    { preHandler: requireAuth },
    async (request, reply) => {
      const db = await getDb();
      await requireAdmin(db, request.user!.sub);

      const pending = await db
        .select()
        .from(schema.events)
        .where(eq(schema.events.status, "published"))
        .orderBy(desc(schema.events.createdAt));

      const orgIds = [...new Set(pending.map((e) => e.orgId))];
      let orgsMap: Record<string, typeof schema.organizations.$inferSelect> = {};

      if (orgIds.length > 0) {
        const orgs = await db
          .select()
          .from(schema.organizations)
          .where(inArray(schema.organizations.id, orgIds));
        for (const org of orgs) orgsMap[org.id] = org;
      }

      return reply.send({
        data: pending.map((e) => ({
          ...e,
          startAt: e.startAt.toISOString(),
          endAt: e.endAt?.toISOString() ?? null,
          createdAt: e.createdAt.toISOString(),
          updatedAt: e.updatedAt.toISOString(),
          organization: orgsMap[e.orgId]
            ? {
                id: orgsMap[e.orgId].id,
                name: orgsMap[e.orgId].name,
                slug: orgsMap[e.orgId].slug,
              }
            : null,
        })),
      });
    }
  );

  // ── Admin: Categories CRUD ──────────────────────────────────

  app.get("/categories", async (_request, reply) => {
    const db = await getDb();
    const cats = await db
      .select()
      .from(schema.categories)
      .orderBy(schema.categories.sortOrder);
    return reply.send({ data: cats });
  });

  app.post(
    "/admin/categories",
    { preHandler: requireAuth },
    async (request, reply) => {
      const body = createCategorySchema.parse(request.body);
      const db = await getDb();
      await requireAdmin(db, request.user!.sub);

      const [cat] = await db
        .insert(schema.categories)
        .values(body)
        .returning();

      return reply.status(201).send(cat);
    }
  );

  app.put(
    "/admin/categories/:id",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = createCategorySchema.partial().parse(request.body);
      const db = await getDb();
      await requireAdmin(db, request.user!.sub);

      const [updated] = await db
        .update(schema.categories)
        .set(body)
        .where(eq(schema.categories.id, id))
        .returning();

      if (!updated) {
        return reply.status(404).send({ error: "Category not found" });
      }

      return reply.send(updated);
    }
  );

  app.delete(
    "/admin/categories/:id",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const db = await getDb();
      await requireAdmin(db, request.user!.sub);

      await db.delete(schema.categories).where(eq(schema.categories.id, id));
      return reply.status(204).send();
    }
  );

  // ── Admin: Organization management ──────────────────────────

  app.get(
    "/admin/organizations",
    { preHandler: requireAuth },
    async (request, reply) => {
      const db = await getDb();
      await requireAdmin(db, request.user!.sub);

      const orgs = await db.select().from(schema.organizations);
      return reply.send({
        data: orgs.map((o) => ({
          ...o,
          createdAt: o.createdAt.toISOString(),
          updatedAt: o.updatedAt.toISOString(),
          fbTokenExpiresAt: o.fbTokenExpiresAt?.toISOString() ?? null,
        })),
      });
    }
  );

  app.put(
    "/admin/organizations/:id/status",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { status } = request.body as {
        status: "active" | "pending" | "suspended";
      };
      const db = await getDb();
      await requireAdmin(db, request.user!.sub);

      const [updated] = await db
        .update(schema.organizations)
        .set({ status, updatedAt: new Date() })
        .where(eq(schema.organizations.id, id))
        .returning();

      return reply.send({
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      });
    }
  );

  // ── Admin: Dashboard stats ──────────────────────────────────

  app.get(
    "/admin/stats",
    { preHandler: requireAuth },
    async (request, reply) => {
      const db = await getDb();
      await requireAdmin(db, request.user!.sub);

      const [eventCounts] = await db
        .select({
          total: sql<number>`count(*)`,
          pending: sql<number>`count(*) filter (where ${schema.events.status} = 'published')`,
          approved: sql<number>`count(*) filter (where ${schema.events.status} = 'approved')`,
        })
        .from(schema.events);

      const [orgCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.organizations);

      return reply.send({
        events: eventCounts,
        organizations: Number(orgCount.count),
      });
    }
  );
}
