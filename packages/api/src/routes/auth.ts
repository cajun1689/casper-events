import { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import * as schema from "@cyh/shared/db";
import { signUpSchema, signInSchema } from "@cyh/shared";
import { getDb } from "../db/connection.js";
import { requireAuth } from "../middleware/auth.js";

export async function authRoutes(app: FastifyInstance) {
  // Register user record after Cognito signup
  // The frontend handles Cognito signup directly; this endpoint
  // creates the local user record and optionally the org.
  app.post("/auth/register", { preHandler: requireAuth }, async (request, reply) => {
    const { organizationName, organizationSlug } = request.body as {
      organizationName?: string;
      organizationSlug?: string;
    };
    const db = await getDb();

    const existing = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.cognitoSub, request.user!.sub));

    if (existing.length > 0) {
      return reply.send(existing[0]);
    }

    let orgId: string | undefined;

    if (organizationName && organizationSlug) {
      const [org] = await db
        .insert(schema.organizations)
        .values({
          name: organizationName,
          slug: organizationSlug,
          status: "active",
        })
        .returning();

      orgId = org.id;

      await db.insert(schema.embedConfigs).values({ orgId: org.id });
    }

    const [user] = await db
      .insert(schema.users)
      .values({
        email: request.user!.email,
        name: request.user!.name,
        cognitoSub: request.user!.sub,
        orgId: orgId ?? null,
        role: orgId ? "owner" : "viewer",
      })
      .returning();

    return reply.status(201).send(user);
  });

  // Get current user profile
  app.get("/auth/me", { preHandler: requireAuth }, async (request, reply) => {
    const db = await getDb();

    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.cognitoSub, request.user!.sub));

    if (!user) {
      return reply.status(404).send({ error: "User not found" });
    }

    let org = null;
    if (user.orgId) {
      const [orgResult] = await db
        .select()
        .from(schema.organizations)
        .where(eq(schema.organizations.id, user.orgId));
      if (orgResult) {
        const { facebookPageToken, ...publicOrg } = orgResult;
        org = {
          ...publicOrg,
          createdAt: publicOrg.createdAt.toISOString(),
          updatedAt: publicOrg.updatedAt.toISOString(),
        };
      }
    }

    return reply.send({ user, organization: org });
  });
}
