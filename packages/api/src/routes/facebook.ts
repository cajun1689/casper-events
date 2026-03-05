import { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import * as schema from "@cyh/shared/db";
import { getDb } from "../db/connection.js";
import { requireAuth } from "../middleware/auth.js";
import { resolveUserOrg } from "../services/user-org.js";

const FB_APP_ID = process.env.FACEBOOK_APP_ID || "";
const FB_APP_SECRET = process.env.FACEBOOK_APP_SECRET || "";
const FB_REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI || "";

export async function facebookRoutes(app: FastifyInstance) {
  // Initiate Facebook OAuth
  app.get(
    "/auth/facebook/connect",
    { preHandler: requireAuth },
    async (request, reply) => {
      const scopes = [
        "pages_show_list",
        "pages_read_engagement",
        "pages_manage_posts",
      ].join(",");

      const url =
        `https://www.facebook.com/v21.0/dialog/oauth?` +
        `client_id=${FB_APP_ID}` +
        `&redirect_uri=${encodeURIComponent(FB_REDIRECT_URI)}` +
        `&scope=${scopes}` +
        `&state=${request.user!.sub}`;

      return reply.send({ url });
    }
  );

  // Facebook OAuth callback
  app.get("/auth/facebook/callback", async (request, reply) => {
    const { code, state: cognitoSub } = request.query as {
      code: string;
      state: string;
    };

    // Exchange code for access token
    const tokenUrl =
      `https://graph.facebook.com/v21.0/oauth/access_token?` +
      `client_id=${FB_APP_ID}` +
      `&client_secret=${FB_APP_SECRET}` +
      `&redirect_uri=${encodeURIComponent(FB_REDIRECT_URI)}` +
      `&code=${code}`;

    const tokenRes = await fetch(tokenUrl);
    const tokenData = (await tokenRes.json()) as {
      access_token: string;
      error?: { message: string };
    };

    if (tokenData.error) {
      return reply.status(400).send({ error: tokenData.error.message });
    }

    // Exchange for long-lived user token
    const longLivedUrl =
      `https://graph.facebook.com/v21.0/oauth/access_token?` +
      `grant_type=fb_exchange_token` +
      `&client_id=${FB_APP_ID}` +
      `&client_secret=${FB_APP_SECRET}` +
      `&fb_exchange_token=${tokenData.access_token}`;

    const longLivedRes = await fetch(longLivedUrl);
    const longLivedData = (await longLivedRes.json()) as {
      access_token: string;
    };

    // Get pages the user manages
    const pagesRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${longLivedData.access_token}`
    );
    const pagesData = (await pagesRes.json()) as {
      data: { id: string; name: string; access_token: string }[];
    };

    if (!pagesData.data || pagesData.data.length === 0) {
      return reply.status(400).send({ error: "No Facebook Pages found" });
    }

    // For now, use the first page. In production, let the user pick.
    const page = pagesData.data[0];

    const db = await getDb();
    const userOrg = await resolveUserOrg(db, cognitoSub);

    if (!userOrg) {
      return reply.status(403).send({ error: "No organization found" });
    }

    await db
      .update(schema.organizations)
      .set({
        facebookPageId: page.id,
        facebookPageToken: page.access_token,
        fbTokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // ~60 days
        updatedAt: new Date(),
      })
      .where(eq(schema.organizations.id, userOrg.orgId));

    // Redirect back to the dashboard
    return reply.redirect("/dashboard/settings?facebook=connected");
  });

  // Post event to Facebook Page
  app.post(
    "/events/:id/facebook/share",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const db = await getDb();
      const userOrg = await resolveUserOrg(db, request.user!.sub);

      if (!userOrg) {
        return reply.status(403).send({ error: "Not authorized" });
      }

      const [event] = await db
        .select()
        .from(schema.events)
        .where(eq(schema.events.id, id));

      if (!event || event.orgId !== userOrg.orgId) {
        return reply.status(404).send({ error: "Event not found" });
      }

      const [org] = await db
        .select()
        .from(schema.organizations)
        .where(eq(schema.organizations.id, userOrg.orgId));

      if (!org.facebookPageId || !org.facebookPageToken) {
        return reply
          .status(400)
          .send({ error: "Facebook Page not connected" });
      }

      const eventDate = new Date(event.startAt).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });

      const message =
        `${event.title}\n\n` +
        `${eventDate}\n` +
        (event.venueName ? `${event.venueName}\n` : "") +
        (event.address ? `${event.address}\n` : "") +
        `\n` +
        (event.description ? `${event.description.substring(0, 500)}\n\n` : "");

      const postUrl = `https://graph.facebook.com/v21.0/${org.facebookPageId}/feed`;
      const postRes = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          access_token: org.facebookPageToken,
        }),
      });

      const postData = (await postRes.json()) as {
        id?: string;
        error?: { message: string };
      };

      if (postData.error) {
        return reply.status(400).send({ error: postData.error.message });
      }

      // Try to create a Facebook Event (may fail if permission not granted)
      try {
        const fbEventUrl = `https://graph.facebook.com/v21.0/${org.facebookPageId}/events`;
        const fbEventRes = await fetch(fbEventUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: event.title,
            description: event.description || "",
            start_time: event.startAt.toISOString(),
            end_time: event.endAt?.toISOString(),
            place: event.venueName
              ? { name: event.venueName }
              : undefined,
            access_token: org.facebookPageToken,
          }),
        });

        const fbEventData = (await fbEventRes.json()) as { id?: string };

        if (fbEventData.id) {
          await db
            .update(schema.events)
            .set({ facebookEventId: fbEventData.id })
            .where(eq(schema.events.id, id));
        }
      } catch {
        // Facebook Event creation is best-effort
      }

      return reply.send({
        success: true,
        postId: postData.id,
      });
    }
  );

  // List connected Facebook pages
  app.get(
    "/facebook/pages",
    { preHandler: requireAuth },
    async (request, reply) => {
      const db = await getDb();
      const userOrg = await resolveUserOrg(db, request.user!.sub);

      if (!userOrg) {
        return reply.status(403).send({ error: "Not authorized" });
      }

      const [org] = await db
        .select()
        .from(schema.organizations)
        .where(eq(schema.organizations.id, userOrg.orgId));

      return reply.send({
        connected: !!org.facebookPageId,
        pageId: org.facebookPageId,
      });
    }
  );

  // Disconnect Facebook
  app.delete(
    "/facebook/disconnect",
    { preHandler: requireAuth },
    async (request, reply) => {
      const db = await getDb();
      const userOrg = await resolveUserOrg(db, request.user!.sub);

      if (!userOrg) {
        return reply.status(403).send({ error: "Not authorized" });
      }

      await db
        .update(schema.organizations)
        .set({
          facebookPageId: null,
          facebookPageToken: null,
          fbTokenExpiresAt: null,
          updatedAt: new Date(),
        })
        .where(eq(schema.organizations.id, userOrg.orgId));

      return reply.send({ success: true });
    }
  );
}
