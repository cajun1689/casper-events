import { FastifyInstance } from "fastify";
import { eq, and, or, inArray } from "drizzle-orm";
import * as schema from "@cyh/shared/db";
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  createConnectionSchema,
} from "@cyh/shared";
import { getDb } from "../db/connection.js";
import { requireAuth } from "../middleware/auth.js";
import { resolveUserOrg } from "../services/user-org.js";

export async function organizationRoutes(app: FastifyInstance) {
  // List organizations (public)
  app.get("/organizations", async (_request, reply) => {
    const db = await getDb();
    const orgs = await db
      .select({
        id: schema.organizations.id,
        name: schema.organizations.name,
        slug: schema.organizations.slug,
        description: schema.organizations.description,
        website: schema.organizations.website,
        logoUrl: schema.organizations.logoUrl,
        phone: schema.organizations.phone,
        email: schema.organizations.email,
        address: schema.organizations.address,
        status: schema.organizations.status,
      })
      .from(schema.organizations)
      .where(eq(schema.organizations.status, "active"));

    return reply.send({ data: orgs });
  });

  // Get org by slug (public)
  app.get("/organizations/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const db = await getDb();

    const [org] = await db
      .select()
      .from(schema.organizations)
      .where(eq(schema.organizations.slug, slug));

    if (!org) {
      return reply.status(404).send({ error: "Organization not found" });
    }

    const { facebookPageToken, ...publicOrg } = org;
    return reply.send({
      ...publicOrg,
      createdAt: publicOrg.createdAt.toISOString(),
      updatedAt: publicOrg.updatedAt.toISOString(),
      fbTokenExpiresAt: publicOrg.fbTokenExpiresAt?.toISOString() ?? null,
    });
  });

  // Register new organization (requires auth)
  app.post(
    "/organizations",
    { preHandler: requireAuth },
    async (request, reply) => {
      const body = createOrganizationSchema.parse(request.body);
      const db = await getDb();

      const existing = await db
        .select({ id: schema.organizations.id })
        .from(schema.organizations)
        .where(eq(schema.organizations.slug, body.slug));

      if (existing.length > 0) {
        return reply.status(409).send({ error: "Organization slug already taken" });
      }

      const [org] = await db
        .insert(schema.organizations)
        .values({ ...body, status: "active" })
        .returning();

      // Link the creating user to this org as owner
      await db
        .update(schema.users)
        .set({ orgId: org.id, role: "owner" })
        .where(eq(schema.users.cognitoSub, request.user!.sub));

      // Create default embed config
      await db.insert(schema.embedConfigs).values({ orgId: org.id });

      return reply.status(201).send({
        ...org,
        createdAt: org.createdAt.toISOString(),
        updatedAt: org.updatedAt.toISOString(),
      });
    }
  );

  // Update organization
  app.put(
    "/organizations/:id",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = updateOrganizationSchema.parse(request.body);
      const db = await getDb();
      const userOrg = await resolveUserOrg(db, request.user!.sub);

      if (!userOrg?.isAdmin && userOrg?.orgId !== id) {
        return reply.status(403).send({ error: "Not authorized" });
      }

      const [updated] = await db
        .update(schema.organizations)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(schema.organizations.id, id))
        .returning();

      if (!updated) {
        return reply.status(404).send({ error: "Organization not found" });
      }

      return reply.send({
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      });
    }
  );

  // ── Org Connections ─────────────────────────────────────────

  app.post(
    "/organizations/:id/connections",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = createConnectionSchema.parse(request.body);
      const db = await getDb();
      const userOrg = await resolveUserOrg(db, request.user!.sub);

      if (userOrg?.orgId !== id && !userOrg?.isAdmin) {
        return reply.status(403).send({ error: "Not authorized" });
      }

      const [connection] = await db
        .insert(schema.orgConnections)
        .values({
          orgId: id,
          connectedOrgId: body.connectedOrgId,
          status: "pending",
        })
        .returning();

      return reply.status(201).send(connection);
    }
  );

  app.get(
    "/organizations/:id/connections",
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const db = await getDb();

      const connections = await db
        .select()
        .from(schema.orgConnections)
        .where(
          and(
            or(
              eq(schema.orgConnections.orgId, id),
              eq(schema.orgConnections.connectedOrgId, id)
            ),
            eq(schema.orgConnections.status, "accepted")
          )
        );

      const connectedOrgIds = connections.map((c) =>
        c.orgId === id ? c.connectedOrgId : c.orgId
      );

      if (connectedOrgIds.length === 0) {
        return reply.send({ data: [] });
      }

      const orgs = await db
        .select({
          id: schema.organizations.id,
          name: schema.organizations.name,
          slug: schema.organizations.slug,
          logoUrl: schema.organizations.logoUrl,
        })
        .from(schema.organizations)
        .where(inArray(schema.organizations.id, connectedOrgIds));

      return reply.send({ data: orgs });
    }
  );

  // Accept/reject connection
  app.put(
    "/organizations/:id/connections/:connectionId",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { id, connectionId } = request.params as {
        id: string;
        connectionId: string;
      };
      const { status } = request.body as { status: "accepted" | "rejected" };
      const db = await getDb();
      const userOrg = await resolveUserOrg(db, request.user!.sub);

      if (userOrg?.orgId !== id && !userOrg?.isAdmin) {
        return reply.status(403).send({ error: "Not authorized" });
      }

      const [updated] = await db
        .update(schema.orgConnections)
        .set({ status })
        .where(eq(schema.orgConnections.id, connectionId))
        .returning();

      return reply.send(updated);
    }
  );
}
