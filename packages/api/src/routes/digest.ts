import { FastifyInstance } from "fastify";
import { eq, and, gte, lte } from "drizzle-orm";
import * as schema from "@cyh/shared/db";
import { digestSubscribeSchema } from "@cyh/shared";
import { getDb } from "../db/connection.js";
import { randomBytes } from "crypto";

export async function digestRoutes(app: FastifyInstance) {
  app.post("/digest/subscribe", async (request, reply) => {
    const body = digestSubscribeSchema.parse(request.body);
    const db = await getDb();

    const token = randomBytes(32).toString("hex");

    await db
      .insert(schema.digestSubscribers)
      .values({
        email: body.email.trim().toLowerCase(),
        preferences: { categories: body.categories ?? [] },
        unsubscribeToken: token,
      })
      .onConflictDoUpdate({
        target: schema.digestSubscribers.email,
        set: {
          preferences: { categories: body.categories ?? [] },
          active: true,
          unsubscribeToken: token,
        },
      });

    return reply.send({
      success: true,
      message: "You're subscribed! You'll receive a weekly digest of upcoming events.",
    });
  });

  app.get("/digest/unsubscribe/:token", async (request, reply) => {
    const { token } = request.params as { token: string };
    const db = await getDb();

    await db
      .update(schema.digestSubscribers)
      .set({ active: false })
      .where(eq(schema.digestSubscribers.unsubscribeToken, token));

    const webUrl = process.env.WEB_URL || "https://casperevents.org";
    return reply.redirect(302, `${webUrl}/unsubscribed?digest=1`);
  });
}
