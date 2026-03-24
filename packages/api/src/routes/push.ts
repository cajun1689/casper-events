import { FastifyInstance } from "fastify";
import { eq, and } from "drizzle-orm";
import * as schema from "@cyh/shared/db";
import { z } from "zod";
import { getDb } from "../db/connection.js";
import { optionalAuth } from "../middleware/auth.js";

const registerSchema = z.object({
  token: z.string().min(1).max(255),
  platform: z.enum(["ios", "android"]),
});

const putOrgsSchema = z.object({
  token: z.string().min(1).max(255),
  orgIds: z.array(z.string().uuid()),
});

export async function pushRoutes(app: FastifyInstance) {
  // Register or update push token (optional auth - anonymous allowed)
  app.post(
    "/push/register",
    { preHandler: optionalAuth },
    async (request, reply) => {
      const body = registerSchema.parse(request.body);
      const db = await getDb();

      let userId: string | null = null;
      if (request.user?.sub) {
        const [user] = await db
          .select({ id: schema.users.id })
          .from(schema.users)
          .where(eq(schema.users.cognitoSub, request.user.sub));
        if (user) userId = user.id;
      }

      const [existing] = await db
        .select()
        .from(schema.pushSubscriptions)
        .where(eq(schema.pushSubscriptions.expoPushToken, body.token));

      if (existing) {
        await db
          .update(schema.pushSubscriptions)
          .set({
            userId,
            platform: body.platform,
            updatedAt: new Date(),
          })
          .where(eq(schema.pushSubscriptions.id, existing.id));
      } else {
        await db.insert(schema.pushSubscriptions).values({
          expoPushToken: body.token,
          platform: body.platform,
          userId,
        });
      }

      return reply.status(204).send();
    }
  );

  // Set subscribed orgs for the current device (optional auth)
  app.put(
    "/push/orgs",
    { preHandler: optionalAuth },
    async (request, reply) => {
      const body = putOrgsSchema.parse(request.body);
      const db = await getDb();

      const [sub] = await db
        .select()
        .from(schema.pushSubscriptions)
        .where(eq(schema.pushSubscriptions.expoPushToken, body.token));

      if (!sub) {
        return reply.status(404).send({
          error: "Device not registered. Call POST /push/register first.",
        });
      }

      await db
        .delete(schema.pushSubscriptionOrgs)
        .where(eq(schema.pushSubscriptionOrgs.subscriptionId, sub.id));

      if (body.orgIds.length > 0) {
        await db.insert(schema.pushSubscriptionOrgs).values(
          body.orgIds.map((orgId) => ({
            subscriptionId: sub.id,
            orgId,
          }))
        );
      }

      return reply.status(204).send();
    }
  );

  // Get subscribed orgs for the current device
  app.get("/push/orgs", async (request, reply) => {
    const token = (request.query as { token?: string }).token;
    if (!token) {
      return reply.status(400).send({ error: "token query param required" });
    }

    const db = await getDb();

    const [sub] = await db
      .select()
      .from(schema.pushSubscriptions)
      .where(eq(schema.pushSubscriptions.expoPushToken, token));

    if (!sub) {
      return reply.send({ orgIds: [] });
    }

    const rows = await db
      .select({ orgId: schema.pushSubscriptionOrgs.orgId })
      .from(schema.pushSubscriptionOrgs)
      .where(eq(schema.pushSubscriptionOrgs.subscriptionId, sub.id));

    return reply.send({
      orgIds: rows.map((r) => r.orgId),
    });
  });

  // Unregister device (no auth required)
  app.delete("/push/unregister", { preHandler: optionalAuth }, async (request, reply) => {
    const token = (request.query as { token?: string }).token;
    if (!token) {
      return reply.status(400).send({ error: "token query param required" });
    }

    const db = await getDb();

    await db
      .delete(schema.pushSubscriptions)
      .where(eq(schema.pushSubscriptions.expoPushToken, token));

    return reply.status(204).send();
  });
}
