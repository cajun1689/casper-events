import { FastifyInstance } from "fastify";
import { eq, and, isNull } from "drizzle-orm";
import * as schema from "@cyh/shared/db";
import { signUpSchema, signInSchema } from "@cyh/shared";
import { getDb } from "../db/connection.js";
import { requireAuth } from "../middleware/auth.js";

async function getRequireInviteCode(db: Awaited<ReturnType<typeof getDb>>): Promise<boolean> {
  const [row] = await db
    .select()
    .from(schema.appSettings)
    .where(eq(schema.appSettings.key, "require_invite_code"));
  return row?.value === "true";
}

export async function authRoutes(app: FastifyInstance) {
  // Public: Beta status (invite code required?)
  app.get("/auth/beta-status", async (_request, reply) => {
    const db = await getDb();
    const requireInviteCode = await getRequireInviteCode(db);
    return reply.send({ requireInviteCode });
  });

  // Public: Validate invite code (does not consume)
  app.post("/auth/validate-invite", async (request, reply) => {
    const { code } = request.body as { code?: string };
    if (!code || typeof code !== "string") {
      return reply.status(400).send({ valid: false, error: "Code is required" });
    }
    const db = await getDb();
    const [row] = await db
      .select()
      .from(schema.inviteCodes)
      .where(and(eq(schema.inviteCodes.code, code.trim().toUpperCase()), isNull(schema.inviteCodes.usedAt)));
    return reply.send({ valid: !!row });
  });

  // Register user record after Cognito signup
  // The frontend handles Cognito signup directly; this endpoint
  // creates the local user record and optionally the org.
  app.post("/auth/register", { preHandler: requireAuth }, async (request, reply) => {
    const { organizationName, organizationSlug, inviteCode } = request.body as {
      organizationName?: string;
      organizationSlug?: string;
      inviteCode?: string;
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
      const requireInviteCode = await getRequireInviteCode(db);
      if (requireInviteCode) {
        const code = inviteCode?.trim()?.toUpperCase();
        if (!code) {
          return reply.status(400).send({ error: "Invite code is required to create an organization during beta" });
        }
        const [invite] = await db
          .select()
          .from(schema.inviteCodes)
          .where(and(eq(schema.inviteCodes.code, code), isNull(schema.inviteCodes.usedAt)));
        if (!invite) {
          return reply.status(400).send({ error: "Invalid or already used invite code" });
        }
      }

      const [org] = await db
        .insert(schema.organizations)
        .values({
          name: organizationName,
          slug: organizationSlug,
          status: "pending",
        })
        .returning();

      orgId = org.id;

      await db.insert(schema.embedConfigs).values({ orgId: org.id });

      if (requireInviteCode && inviteCode?.trim()) {
        const code = inviteCode.trim().toUpperCase();
        await db
          .update(schema.inviteCodes)
          .set({ usedAt: new Date(), usedByOrgId: org.id })
          .where(eq(schema.inviteCodes.code, code));
      }
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
