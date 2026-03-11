import { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import * as schema from "@cyh/shared/db";
import { getDb } from "../db/connection.js";

export type SiteSponsor = {
  name: string;
  logoUrl: string;
  url: string;
  level: "presenting" | "gold" | "silver" | "bronze" | "community";
  sortOrder: number;
};

export async function siteSponsorsRoutes(app: FastifyInstance) {
  app.get("/site-sponsors", async (_request, reply) => {
    const db = await getDb();
    const [row] = await db
      .select()
      .from(schema.appSettings)
      .where(eq(schema.appSettings.key, "site_sponsors"));
    const sponsors: SiteSponsor[] = row?.value ? JSON.parse(row.value) : [];
    return reply.send({ data: sponsors });
  });
}
