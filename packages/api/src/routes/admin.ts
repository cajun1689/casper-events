import { FastifyInstance } from "fastify";
import { eq, inArray, sql, desc } from "drizzle-orm";
import { randomBytes } from "crypto";
import * as schema from "@cyh/shared/db";
import { reviewEventSchema, createCategorySchema } from "@cyh/shared";
import { getDb } from "../db/connection.js";
import { requireAuth } from "../middleware/auth.js";
import { resolveUserOrg } from "../services/user-org.js";
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || "us-east-1" });
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || "";

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

async function getRequireInviteCode(db: Awaited<ReturnType<typeof getDb>>): Promise<boolean> {
  const [row] = await db
    .select()
    .from(schema.appSettings)
    .where(eq(schema.appSettings.key, "require_invite_code"));
  return row?.value === "true";
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function adminRoutes(app: FastifyInstance) {
  // ── Admin: Beta status & invite codes ──────────────────────

  app.get(
    "/admin/beta-status",
    { preHandler: requireAuth },
    async (request, reply) => {
      const db = await getDb();
      await requireAdmin(db, request.user!.sub);
      const requireInviteCode = await getRequireInviteCode(db);
      return reply.send({ requireInviteCode });
    }
  );

  app.put(
    "/admin/beta-status",
    { preHandler: requireAuth },
    async (request, reply) => {
      const db = await getDb();
      await requireAdmin(db, request.user!.sub);
      const { requireInviteCode } = request.body as { requireInviteCode?: boolean };
      const value = requireInviteCode ? "true" : "false";
      const [existing] = await db
        .select()
        .from(schema.appSettings)
        .where(eq(schema.appSettings.key, "require_invite_code"));
      if (existing) {
        await db
          .update(schema.appSettings)
          .set({ value, updatedAt: new Date() })
          .where(eq(schema.appSettings.key, "require_invite_code"));
      } else {
        await db.insert(schema.appSettings).values({ key: "require_invite_code", value });
      }
      return reply.send({ requireInviteCode: !!requireInviteCode });
    }
  );

  app.get(
    "/admin/invite-codes",
    { preHandler: requireAuth },
    async (request, reply) => {
      const db = await getDb();
      await requireAdmin(db, request.user!.sub);
      const codes = await db
        .select()
        .from(schema.inviteCodes)
        .orderBy(desc(schema.inviteCodes.createdAt));
      return reply.send({
        data: codes.map((c) => ({
          id: c.id,
          code: c.code,
          createdAt: c.createdAt.toISOString(),
          usedAt: c.usedAt?.toISOString() ?? null,
          usedByOrgId: c.usedByOrgId,
        })),
      });
    }
  );

  app.post(
    "/admin/invite-codes",
    { preHandler: requireAuth },
    async (request, reply) => {
      const db = await getDb();
      const admin = await requireAdmin(db, request.user!.sub);
      const { code: customCode } = request.body as { code?: string };
      const code = (customCode?.trim()?.toUpperCase() || generateInviteCode()).toUpperCase();
      if (!code || code.length < 4) {
        return reply.status(400).send({ error: "Code must be at least 4 characters" });
      }
      const existing = await db
        .select()
        .from(schema.inviteCodes)
        .where(eq(schema.inviteCodes.code, code));
      if (existing.length > 0) {
        return reply.status(409).send({ error: "Invite code already exists" });
      }
      const [created] = await db
        .insert(schema.inviteCodes)
        .values({ code, createdBy: admin.userId })
        .returning();
      return reply.status(201).send({ id: created.id, code: created.code });
    }
  );

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
        .where(inArray(schema.events.status, ["draft", "published"]))
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

  // ── Admin: Update organization details ─────────────────────

  app.put(
    "/admin/organizations/:id",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as {
        name?: string;
        slug?: string;
        logoUrl?: string | null;
        description?: string | null;
        website?: string | null;
        autoApprove?: boolean;
        communityHub?: boolean;
      };
      const db = await getDb();
      await requireAdmin(db, request.user!.sub);

      const updates: Record<string, unknown> = { updatedAt: new Date() };
      if (body.name !== undefined) updates.name = body.name;
      if (body.slug !== undefined) updates.slug = body.slug;
      if (body.logoUrl !== undefined) updates.logoUrl = body.logoUrl;
      if (body.description !== undefined) updates.description = body.description;
      if (body.website !== undefined) updates.website = body.website;
      if (body.autoApprove !== undefined) updates.autoApprove = body.autoApprove;
      if (body.communityHub !== undefined) updates.communityHub = body.communityHub;

      const [updated] = await db
        .update(schema.organizations)
        .set(updates)
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
    },
  );

  // ── Admin: Create organization with user account ───────────

  app.post(
    "/admin/organizations",
    { preHandler: requireAuth },
    async (request, reply) => {
      const db = await getDb();
      await requireAdmin(db, request.user!.sub);

      const { orgName, orgSlug, contactName, contactEmail } = request.body as {
        orgName: string;
        orgSlug: string;
        contactName: string;
        contactEmail: string;
      };

      if (!orgName || !orgSlug || !contactName || !contactEmail) {
        return reply.status(400).send({ error: "All fields are required" });
      }

      const existingOrg = await db
        .select()
        .from(schema.organizations)
        .where(eq(schema.organizations.slug, orgSlug));

      if (existingOrg.length > 0) {
        return reply.status(409).send({ error: `Organization slug "${orgSlug}" is already taken` });
      }

      const tempPassword = `Casper${Math.random().toString(36).slice(2, 8)}!${Math.floor(Math.random() * 90 + 10)}`;

      let cognitoSub: string;
      try {
        const cognitoResult = await cognitoClient.send(
          new AdminCreateUserCommand({
            UserPoolId: USER_POOL_ID,
            Username: contactEmail,
            TemporaryPassword: tempPassword,
            UserAttributes: [
              { Name: "email", Value: contactEmail },
              { Name: "email_verified", Value: "true" },
              { Name: "name", Value: contactName },
            ],
            DesiredDeliveryMediums: ["EMAIL"],
            MessageAction: undefined,
          }),
        );
        cognitoSub = cognitoResult.User?.Username || "";
        if (!cognitoSub) {
          return reply.status(500).send({ error: "Failed to create Cognito user" });
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to create user account";
        if (message.includes("UsernameExistsException") || message.includes("already exists")) {
          return reply.status(409).send({ error: `A user with email ${contactEmail} already exists` });
        }
        return reply.status(500).send({ error: message });
      }

      const [org] = await db
        .insert(schema.organizations)
        .values({
          name: orgName,
          slug: orgSlug,
          status: "active",
        })
        .returning();

      await db.insert(schema.embedConfigs).values({ orgId: org.id });

      await db.insert(schema.users).values({
        email: contactEmail,
        name: contactName,
        cognitoSub,
        orgId: org.id,
        role: "owner",
      });

      return reply.status(201).send({
        organization: {
          ...org,
          createdAt: org.createdAt.toISOString(),
          updatedAt: org.updatedAt.toISOString(),
        },
        tempPassword,
      });
    },
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
          pending: sql<number>`count(*) filter (where ${schema.events.status} = 'draft' or ${schema.events.status} = 'published')`,
          approved: sql<number>`count(*) filter (where ${schema.events.status} = 'approved')`,
        })
        .from(schema.events);

      const [orgCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.organizations);

      const [digestCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.digestSubscribers)
        .where(eq(schema.digestSubscribers.active, true));

      return reply.send({
        events: eventCounts,
        organizations: Number(orgCount.count),
        digestSubscribers: Number(digestCount.count),
      });
    }
  );

  // ── Admin: Digest subscribers ─────────────────────────────────

  app.get(
    "/admin/digest/subscribers",
    { preHandler: requireAuth },
    async (request, reply) => {
      const db = await getDb();
      await requireAdmin(db, request.user!.sub);
      const subs = await db
        .select()
        .from(schema.digestSubscribers)
        .orderBy(desc(schema.digestSubscribers.createdAt));
      return reply.send({
        data: subs.map((s) => ({
          id: s.id,
          email: s.email,
          active: s.active,
          createdAt: s.createdAt.toISOString(),
        })),
      });
    }
  );

  app.post(
    "/admin/digest/subscribers",
    { preHandler: requireAuth },
    async (request, reply) => {
      const db = await getDb();
      await requireAdmin(db, request.user!.sub);
      const { email } = request.body as { email: string };
      if (!email || !email.trim()) {
        return reply.status(400).send({ error: "Email is required" });
      }
      const token = randomBytes(32).toString("hex");
      await db
        .insert(schema.digestSubscribers)
        .values({
          email: email.trim().toLowerCase(),
          preferences: {},
          unsubscribeToken: token,
          active: true,
        })
        .onConflictDoUpdate({
          target: schema.digestSubscribers.email,
          set: { active: true, unsubscribeToken: token },
        });
      return reply.send({ success: true, message: "Subscriber added" });
    }
  );

  app.get(
    "/admin/digest/subscribers/export",
    { preHandler: requireAuth },
    async (request, reply) => {
      const db = await getDb();
      await requireAdmin(db, request.user!.sub);
      const subs = await db
        .select({ email: schema.digestSubscribers.email, active: schema.digestSubscribers.active, createdAt: schema.digestSubscribers.createdAt })
        .from(schema.digestSubscribers)
        .orderBy(desc(schema.digestSubscribers.createdAt));
      const csv = ["email,active,subscribed_at", ...subs.map((s) => `${s.email},${s.active},${s.createdAt.toISOString()}`)].join("\n");
      reply.header("Content-Type", "text/csv");
      reply.header("Content-Disposition", 'attachment; filename="digest-subscribers.csv"');
      return reply.send(csv);
    }
  );

  app.delete(
    "/admin/digest/subscribers/:id",
    { preHandler: requireAuth },
    async (request, reply) => {
      const db = await getDb();
      await requireAdmin(db, request.user!.sub);
      const { id } = request.params as { id: string };
      await db
        .delete(schema.digestSubscribers)
        .where(eq(schema.digestSubscribers.id, id));
      return reply.status(204).send();
    }
  );

  // ── Admin: Digest settings (email template, sponsors, links, header image) ──

  const DEFAULT_DIGEST_SETTINGS = {
    emailHeader: "",
    emailFooter: "",
    headerImageUrl: "",
    sponsors: [] as { name: string; url: string; logoUrl: string }[],
    extraLinks: [] as { label: string; url: string }[],
    latestNews: [] as { imageUrl: string; title: string; author: string; date: string; summary: string; url?: string }[],
  };

  app.get(
    "/admin/digest/settings",
    { preHandler: requireAuth },
    async (request, reply) => {
      const db = await getDb();
      await requireAdmin(db, request.user!.sub);
      const [row] = await db
        .select()
        .from(schema.appSettings)
        .where(eq(schema.appSettings.key, "digest_settings"));
      const settings = row?.value ? { ...DEFAULT_DIGEST_SETTINGS, ...JSON.parse(row.value) } : DEFAULT_DIGEST_SETTINGS;
      return reply.send(settings);
    }
  );

  app.put(
    "/admin/digest/settings",
    { preHandler: requireAuth },
    async (request, reply) => {
      const db = await getDb();
      await requireAdmin(db, request.user!.sub);
      const body = request.body as typeof DEFAULT_DIGEST_SETTINGS;
      const settings = {
        emailHeader: body.emailHeader ?? "",
        emailFooter: body.emailFooter ?? "",
        headerImageUrl: body.headerImageUrl ?? "",
        sponsors: Array.isArray(body.sponsors) ? body.sponsors : [],
        extraLinks: Array.isArray(body.extraLinks) ? body.extraLinks : [],
        latestNews: Array.isArray(body.latestNews) ? body.latestNews : [],
      };
      const value = JSON.stringify(settings);
      const [existing] = await db
        .select()
        .from(schema.appSettings)
        .where(eq(schema.appSettings.key, "digest_settings"));
      if (existing) {
        await db
          .update(schema.appSettings)
          .set({ value, updatedAt: new Date() })
          .where(eq(schema.appSettings.key, "digest_settings"));
      } else {
        await db.insert(schema.appSettings).values({ key: "digest_settings", value });
      }
      return reply.send(settings);
    }
  );
}
