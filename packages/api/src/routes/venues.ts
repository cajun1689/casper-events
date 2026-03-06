import { FastifyInstance } from "fastify";
import { ilike, desc, sql, or } from "drizzle-orm";
import * as schema from "@cyh/shared/db";
import { getDb } from "../db/connection.js";

export async function venueRoutes(app: FastifyInstance) {
  app.get("/venues", async (request, reply) => {
    const { q } = request.query as { q?: string };

    if (!q || q.trim().length < 2) {
      return reply.send({ data: [] });
    }

    const db = await getDb();
    const pattern = `%${q.trim()}%`;

    const results = await db
      .select()
      .from(schema.venues)
      .where(
        or(
          ilike(schema.venues.name, pattern),
          ilike(schema.venues.address, pattern),
        ),
      )
      .orderBy(desc(schema.venues.usageCount))
      .limit(5);

    return reply.send({ data: results });
  });
}

export async function upsertVenue(
  venueName: string,
  address?: string | null,
  latitude?: number | null,
  longitude?: number | null,
) {
  const db = await getDb();
  const trimmedName = venueName.trim();
  if (!trimmedName) return;

  const [existing] = await db
    .select()
    .from(schema.venues)
    .where(ilike(schema.venues.name, trimmedName))
    .limit(1);

  if (existing) {
    await db
      .update(schema.venues)
      .set({
        usageCount: sql`${schema.venues.usageCount} + 1`,
        address: address || existing.address,
        latitude: latitude ?? existing.latitude,
        longitude: longitude ?? existing.longitude,
        updatedAt: new Date(),
      })
      .where(ilike(schema.venues.name, trimmedName));
  } else {
    await db.insert(schema.venues).values({
      name: trimmedName,
      address: address || null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
    });
  }
}
