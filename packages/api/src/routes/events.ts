import { FastifyInstance } from "fastify";
import { eq, and, gte, lte, inArray, sql, ilike, desc, asc, or, SQL } from "drizzle-orm";
import * as schema from "@cyh/shared/db";
import {
  createEventSchema,
  updateEventSchema,
  listEventsSchema,
  rsvpEventSchema,
} from "@cyh/shared";
import { getDb } from "../db/connection.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import { resolveUserOrg } from "../services/user-org.js";
import { upsertVenue } from "./venues.js";

import { geocodeAddress } from "../services/geocode.js";

export async function eventRoutes(app: FastifyInstance) {
  // List events (public, with filters)
  app.get("/events", { preHandler: optionalAuth }, async (request, reply) => {
    const query = listEventsSchema.parse(request.query);
    const db = await getDb();

    let isOwnOrg = false;
    let isAdmin = false;
    if (request.user?.sub) {
      const userOrg = await resolveUserOrg(db, request.user.sub);
      if (userOrg?.isAdmin) isAdmin = true;
      if (query.orgId && userOrg?.orgId === query.orgId) isOwnOrg = true;
    }

    const conditions: SQL[] = [];

    if (query.status) {
      conditions.push(eq(schema.events.status, query.status));
    } else if (isOwnOrg) {
      // Org owners see all statuses (including drafts) only when viewing their own org's events
    } else {
      // Public calendar and other views: only published and approved
      conditions.push(
        inArray(schema.events.status, ["published", "approved"])
      );
    }

    if (query.orgId) {
      conditions.push(eq(schema.events.orgId, query.orgId));
    }

    // Public calendar: exclude past events unless a date range is explicitly set.
    // Roll the cutoff back 24h so events from "today" in any US timezone (especially
    // Mountain) stay visible through 11:59 PM local; client-side handles the exact cutoff.
    if (!query.startAfter && !isOwnOrg && !isAdmin) {
      const now = new Date();
      const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const cutoff = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
      conditions.push(gte(schema.events.startAt, cutoff));
    }

    // Use start of UTC day for startAfter so all-day events (stored at midnight UTC) are included
    if (query.startAfter) {
      const d = new Date(query.startAfter);
      const startOfDayUtc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
      conditions.push(gte(schema.events.startAt, startOfDayUtc));
    }

    if (query.startBefore) {
      conditions.push(lte(schema.events.startAt, new Date(query.startBefore)));
    }

    if (query.search) {
      conditions.push(ilike(schema.events.title, `%${query.search}%`));
    }

    if (query.city && query.city.trim()) {
      const cityPattern = `%${query.city.trim()}%`;
      conditions.push(
        or(
          ilike(schema.events.address, cityPattern),
          ilike(schema.events.venueName, cityPattern)
        )!
      );
    }

    if (query.featured === true) {
      conditions.push(eq(schema.events.featured, true));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const offset = (query.page - 1) * query.limit;

    const [eventsResult, countResult] = await Promise.all([
      db
        .select()
        .from(schema.events)
        .where(where)
        .orderBy(desc(schema.events.featured), asc(schema.events.startAt))
        .limit(query.limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(schema.events)
        .where(where),
    ]);

    const total = Number(countResult[0].count);
    const eventIds = eventsResult.map((e) => e.id);

    let categoriesMap: Record<string, typeof schema.categories.$inferSelect[]> = {};
    let orgCategoriesMap: Record<string, { id: string; name: string; slug: string; icon: string | null; color: string | null; parentCategoryId: string }[]> = {};
    let orgsMap: Record<string, typeof schema.organizations.$inferSelect> = {};
    let sponsorsMap: Record<string, { id: string; name: string; logoUrl: string | null; websiteUrl: string | null; level: string; sortOrder: number }[]> = {};

    if (eventIds.length > 0) {
      const ecRows = await db
        .select({
          eventId: schema.eventCategories.eventId,
          category: schema.categories,
        })
        .from(schema.eventCategories)
        .innerJoin(
          schema.categories,
          eq(schema.eventCategories.categoryId, schema.categories.id)
        )
        .where(inArray(schema.eventCategories.eventId, eventIds));

      for (const row of ecRows) {
        if (!categoriesMap[row.eventId]) categoriesMap[row.eventId] = [];
        categoriesMap[row.eventId].push(row.category);
      }

      const eocRows = await db
        .select({
          eventId: schema.eventOrgCategories.eventId,
          orgCat: schema.orgCategories,
        })
        .from(schema.eventOrgCategories)
        .innerJoin(
          schema.orgCategories,
          eq(schema.eventOrgCategories.orgCategoryId, schema.orgCategories.id)
        )
        .where(inArray(schema.eventOrgCategories.eventId, eventIds));
      for (const row of eocRows) {
        if (!orgCategoriesMap[row.eventId]) orgCategoriesMap[row.eventId] = [];
        orgCategoriesMap[row.eventId].push({
          id: row.orgCat.id,
          name: row.orgCat.name,
          slug: row.orgCat.slug,
          icon: row.orgCat.icon,
          color: row.orgCat.color,
          parentCategoryId: row.orgCat.parentCategoryId,
        });
      }

      const orgIds = [...new Set(eventsResult.map((e) => e.orgId))];
      const orgs = await db
        .select()
        .from(schema.organizations)
        .where(inArray(schema.organizations.id, orgIds));

      for (const org of orgs) {
        orgsMap[org.id] = org;
      }

      const sponsorRows = await db
        .select()
        .from(schema.eventSponsors)
        .where(inArray(schema.eventSponsors.eventId, eventIds))
        .orderBy(asc(schema.eventSponsors.sortOrder));

      for (const row of sponsorRows) {
        if (!sponsorsMap[row.eventId]) sponsorsMap[row.eventId] = [];
        sponsorsMap[row.eventId].push({
          id: row.id,
          name: row.name,
          logoUrl: row.logoUrl,
          websiteUrl: row.websiteUrl,
          level: row.level,
          sortOrder: row.sortOrder,
        });
      }
    }

    let filteredEvents = (isOwnOrg || isAdmin)
      ? eventsResult
      : eventsResult.filter((event) => {
          const org = orgsMap[event.orgId];
          return org && org.status === "active";
        });

    if (query.categories && query.categories.length > 0) {
      const catSlugs = query.categories;
      filteredEvents = filteredEvents.filter((event) => {
        const cats = categoriesMap[event.id] || [];
        return cats.some((c) => catSlugs.includes(c.slug));
      });
    }

    const data = filteredEvents.map((event) => ({
      ...event,
      startAt: event.startAt.toISOString(),
      endAt: event.endAt?.toISOString() ?? null,
      publishAt: event.publishAt?.toISOString() ?? null,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
      organization: orgsMap[event.orgId]
        ? {
            id: orgsMap[event.orgId].id,
            name: orgsMap[event.orgId].name,
            slug: orgsMap[event.orgId].slug,
            logoUrl: orgsMap[event.orgId].logoUrl,
          }
        : null,
      categories: (categoriesMap[event.id] || []).map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        icon: c.icon,
        color: c.color,
      })),
      orgCategories: orgCategoriesMap[event.id] || [],
      color: event.color ?? null,
      subtitle: event.subtitle ?? null,
      snippet: event.snippet ?? null,
      externalUrl: event.externalUrl ?? null,
      externalUrlText: event.externalUrlText ?? null,
      externalUrlCaption: event.externalUrlCaption ?? null,
      featured: event.featured ?? false,
      sponsors: sponsorsMap[event.id] || [],
    }));

    return reply.send({
      data,
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    });
  });

  // Get RSVP count and user status (public)
  app.get("/events/:id/rsvp", { preHandler: optionalAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const db = await getDb();

    const [event] = await db
      .select()
      .from(schema.events)
      .where(eq(schema.events.id, id));

    if (!event) {
      return reply.status(404).send({ error: "Event not found" });
    }

    const [countRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.eventRsvps)
      .where(eq(schema.eventRsvps.eventId, id));

    let userRsvped = false;
    if (request.user?.email) {
      const [existing] = await db
        .select()
        .from(schema.eventRsvps)
        .where(
          and(
            eq(schema.eventRsvps.eventId, id),
            eq(schema.eventRsvps.email, request.user.email)
          )
        );
      userRsvped = !!existing;
    }

    return reply.send({
      count: Number(countRow?.count ?? 0),
      userRsvped,
    });
  });

  // RSVP to event (public, idempotent)
  app.post("/events/:id/rsvp", { preHandler: optionalAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = rsvpEventSchema.parse(request.body ?? {});
    const db = await getDb();

    const [event] = await db
      .select()
      .from(schema.events)
      .where(eq(schema.events.id, id));

    if (!event) {
      return reply.status(404).send({ error: "Event not found" });
    }

    const email = request.user?.email ?? body.email;
    if (!email || !email.trim()) {
      return reply.status(400).send({ error: "Email is required to RSVP (or sign in)" });
    }

    const userOrg = request.user?.sub ? await resolveUserOrg(db, request.user.sub) : null;

    await db
      .insert(schema.eventRsvps)
      .values({
        eventId: id,
        email: email.trim().toLowerCase(),
        userId: userOrg?.userId ?? null,
      })
      .onConflictDoUpdate({
        target: [schema.eventRsvps.eventId, schema.eventRsvps.email],
        set: { createdAt: new Date() },
      });

    const [countRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.eventRsvps)
      .where(eq(schema.eventRsvps.eventId, id));

    return reply.send({
      count: Number(countRow?.count ?? 0),
      userRsvped: true,
    });
  });

  // Get single event
  app.get("/events/:id", { preHandler: optionalAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const db = await getDb();

    const [event] = await db
      .select()
      .from(schema.events)
      .where(eq(schema.events.id, id));

    if (!event) {
      return reply.status(404).send({ error: "Event not found" });
    }

    // Draft and rejected events are not publicly visible
    if (event.status !== "published" && event.status !== "approved") {
      const userOrg = request.user?.sub ? await resolveUserOrg(db, request.user.sub) : null;
      const isOwnOrg = userOrg?.orgId === event.orgId;
      const isAdmin = userOrg?.isAdmin ?? false;
      if (!isOwnOrg && !isAdmin) {
        return reply.status(404).send({ error: "Event not found" });
      }
    }

    const [org] = await db
      .select()
      .from(schema.organizations)
      .where(eq(schema.organizations.id, event.orgId));

    const [ecRows, eocRows, sponsorRows] = await Promise.all([
      db
        .select({ category: schema.categories })
        .from(schema.eventCategories)
        .innerJoin(
          schema.categories,
          eq(schema.eventCategories.categoryId, schema.categories.id)
        )
        .where(eq(schema.eventCategories.eventId, id)),
      db
        .select({ orgCat: schema.orgCategories })
        .from(schema.eventOrgCategories)
        .innerJoin(
          schema.orgCategories,
          eq(schema.eventOrgCategories.orgCategoryId, schema.orgCategories.id)
        )
        .where(eq(schema.eventOrgCategories.eventId, id)),
      db
        .select()
        .from(schema.eventSponsors)
        .where(eq(schema.eventSponsors.eventId, id))
        .orderBy(asc(schema.eventSponsors.sortOrder)),
    ]);

    return reply.send({
      ...event,
      startAt: event.startAt.toISOString(),
      endAt: event.endAt?.toISOString() ?? null,
      publishAt: event.publishAt?.toISOString() ?? null,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
      organization: org
        ? { id: org.id, name: org.name, slug: org.slug, logoUrl: org.logoUrl }
        : null,
      categories: ecRows.map((r) => ({
        id: r.category.id,
        name: r.category.name,
        slug: r.category.slug,
        icon: r.category.icon,
        color: r.category.color,
      })),
      orgCategories: eocRows.map((r) => ({
        id: r.orgCat.id,
        name: r.orgCat.name,
        slug: r.orgCat.slug,
        icon: r.orgCat.icon,
        color: r.orgCat.color,
        parentCategoryId: r.orgCat.parentCategoryId,
      })),
      color: event.color ?? null,
      subtitle: event.subtitle ?? null,
      snippet: event.snippet ?? null,
      externalUrl: event.externalUrl ?? null,
      externalUrlText: event.externalUrlText ?? null,
      externalUrlCaption: event.externalUrlCaption ?? null,
      sponsors: sponsorRows.map((s) => ({
        id: s.id,
        name: s.name,
        logoUrl: s.logoUrl,
        websiteUrl: s.websiteUrl,
        level: s.level,
        sortOrder: s.sortOrder,
      })),
    });
  });

  // Create event
  app.post(
    "/events",
    { preHandler: requireAuth },
    async (request, reply) => {
      const body = createEventSchema.parse(request.body);
      const db = await getDb();
      const userOrg = await resolveUserOrg(db, request.user!.sub);

      if (!userOrg) {
        return reply
          .status(403)
          .send({ error: "You must belong to an organization to create events" });
      }

      const [org] = await db
        .select()
        .from(schema.organizations)
        .where(eq(schema.organizations.id, userOrg.orgId));

      if (org.status === "pending") {
        return reply
          .status(403)
          .send({ error: "Your organization is pending approval. An admin will review it shortly." });
      }

      if (org.status === "suspended") {
        return reply
          .status(403)
          .send({ error: "Your organization has been suspended. Contact an admin for help." });
      }

      const { categoryIds, orgCategoryIds = [], publishAt, ...eventData } = body;

      if ((eventData.address || eventData.venueName) && !eventData.latitude && !eventData.longitude) {
        const geo = await geocodeAddress(eventData.address || eventData.venueName || "");
        if (geo) {
          eventData.latitude = geo.lat;
          eventData.longitude = geo.lon;
        }
      }

      let status: "draft" | "published" | "approved" = publishAt && new Date(publishAt) > new Date() ? "draft" : "published";
      if (status === "published" && org.autoApprove) {
        status = "approved";
      }
      const [event] = await db
        .insert(schema.events)
        .values({
          ...eventData,
          startAt: new Date(eventData.startAt),
          endAt: eventData.endAt ? new Date(eventData.endAt) : null,
          orgId: userOrg.orgId,
          status,
          publishAt: publishAt ? new Date(publishAt) : null,
        })
        .returning();

      if (categoryIds.length > 0) {
        await db.insert(schema.eventCategories).values(
          categoryIds.map((categoryId) => ({
            eventId: event.id,
            categoryId,
          }))
        );
      }

      if (orgCategoryIds.length > 0) {
        const orgCats = await db
          .select({ id: schema.orgCategories.id })
          .from(schema.orgCategories)
          .where(
            and(
              eq(schema.orgCategories.orgId, userOrg.orgId),
              inArray(schema.orgCategories.id, orgCategoryIds)
            )
          );
        const validIds = orgCats.map((c) => c.id);
        if (validIds.length > 0) {
          await db.insert(schema.eventOrgCategories).values(
            validIds.map((orgCategoryId) => ({
              eventId: event.id,
              orgCategoryId,
            }))
          );
        }
      }

      if (eventData.venueName) {
        upsertVenue(eventData.venueName, eventData.address, eventData.latitude, eventData.longitude).catch(() => {});
      }

      const response: Record<string, unknown> = {
        ...event,
        startAt: event.startAt.toISOString(),
        endAt: event.endAt?.toISOString() ?? null,
        publishAt: event.publishAt?.toISOString() ?? null,
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
        facebookEventCreated: false,
      };

      if (eventData.publishToFacebook) {
        try {
          const [org] = await db
            .select()
            .from(schema.organizations)
            .where(eq(schema.organizations.id, userOrg.orgId));

          if (org.facebookPageId && org.facebookPageToken) {
            const fbPayload: Record<string, unknown> = {
              name: event.title,
              start_time: event.startAt.toISOString(),
              description: event.description || undefined,
              access_token: org.facebookPageToken,
            };

            if (event.endAt) fbPayload.end_time = event.endAt.toISOString();

            if (event.isOnline && event.onlineEventUrl) {
              fbPayload.is_online = true;
              fbPayload.online_event_format = "OTHER";
              fbPayload.online_event_third_party_url = event.onlineEventUrl;
            } else if (event.venueName || event.address) {
              fbPayload.place = {
                name: event.venueName || event.address || "",
                location: event.address ? { street: event.address } : undefined,
              };
            }

            if (event.ticketUrl) fbPayload.ticket_uri = event.ticketUrl;

            const fbRes = await fetch(
              `https://graph.facebook.com/v21.0/${org.facebookPageId}/events`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(fbPayload),
              },
            );

            const fbData = (await fbRes.json()) as { id?: string };

            if (fbData.id) {
              await db
                .update(schema.events)
                .set({ facebookEventId: fbData.id })
                .where(eq(schema.events.id, event.id));
              response.facebookEventId = fbData.id;
              response.facebookEventCreated = true;
            }
          }
        } catch {
          // Facebook event creation is best-effort during event creation
        }
      }

      return reply.status(201).send(response);
    }
  );

  // Update event
  app.put(
    "/events/:id",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = updateEventSchema.parse(request.body);
      const db = await getDb();
      const userOrg = await resolveUserOrg(db, request.user!.sub);

      const [existing] = await db
        .select()
        .from(schema.events)
        .where(eq(schema.events.id, id));

      if (!existing) {
        return reply.status(404).send({ error: "Event not found" });
      }

      if (!userOrg?.isAdmin && existing.orgId !== userOrg?.orgId) {
        return reply.status(403).send({ error: "Not authorized" });
      }

      const { categoryIds, orgCategoryIds, publishAt, ...eventData } = body;

      if ((eventData.address || eventData.venueName) && !eventData.latitude && !eventData.longitude) {
        const geo = await geocodeAddress(eventData.address || eventData.venueName || "");
        if (geo) {
          eventData.latitude = geo.lat;
          eventData.longitude = geo.lon;
        }
      }

      const updateData: Record<string, unknown> = { ...eventData, updatedAt: new Date() };
      if (eventData.startAt) updateData.startAt = new Date(eventData.startAt);
      if (eventData.endAt) updateData.endAt = new Date(eventData.endAt);
      if (publishAt !== undefined) updateData.publishAt = publishAt ? new Date(publishAt) : null;
      if (publishAt !== undefined) {
        const pubDate = publishAt ? new Date(publishAt) : null;
        let newStatus: "draft" | "published" | "approved" = pubDate && pubDate > new Date() ? "draft" : "published";
        if (newStatus === "published") {
          const [org] = await db.select().from(schema.organizations).where(eq(schema.organizations.id, existing.orgId));
          if (org?.autoApprove) newStatus = "approved";
        }
        updateData.status = newStatus;
      }

      const [updated] = await db
        .update(schema.events)
        .set(updateData)
        .where(eq(schema.events.id, id))
        .returning();

      if (categoryIds !== undefined) {
        await db
          .delete(schema.eventCategories)
          .where(eq(schema.eventCategories.eventId, id));

        if (categoryIds.length > 0) {
          await db.insert(schema.eventCategories).values(
            categoryIds.map((categoryId) => ({
              eventId: id,
              categoryId,
            }))
          );
        }
      }

      if (orgCategoryIds !== undefined) {
        await db
          .delete(schema.eventOrgCategories)
          .where(eq(schema.eventOrgCategories.eventId, id));

        if (orgCategoryIds.length > 0) {
          const orgCats = await db
            .select({ id: schema.orgCategories.id })
            .from(schema.orgCategories)
            .where(
              and(
                eq(schema.orgCategories.orgId, existing.orgId),
                inArray(schema.orgCategories.id, orgCategoryIds)
              )
            );
          const validIds = orgCats.map((c) => c.id);
          if (validIds.length > 0) {
            await db.insert(schema.eventOrgCategories).values(
              validIds.map((orgCategoryId) => ({
                eventId: id,
                orgCategoryId,
              }))
            );
          }
        }
      }

      return reply.send({
        ...updated,
        startAt: updated.startAt.toISOString(),
        endAt: updated.endAt?.toISOString() ?? null,
        publishAt: updated.publishAt?.toISOString() ?? null,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      });
    }
  );

  // Delete event
  app.delete(
    "/events/:id",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const db = await getDb();
      const userOrg = await resolveUserOrg(db, request.user!.sub);

      const [existing] = await db
        .select()
        .from(schema.events)
        .where(eq(schema.events.id, id));

      if (!existing) {
        return reply.status(404).send({ error: "Event not found" });
      }

      if (!userOrg?.isAdmin && existing.orgId !== userOrg?.orgId) {
        return reply.status(403).send({ error: "Not authorized" });
      }

      await db.delete(schema.events).where(eq(schema.events.id, id));
      return reply.status(204).send();
    }
  );
}
