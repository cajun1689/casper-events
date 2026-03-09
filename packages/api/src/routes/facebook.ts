import crypto from "node:crypto";
import { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import * as schema from "@cyh/shared/db";
import { getDb } from "../db/connection.js";
import { requireAuth } from "../middleware/auth.js";
import { resolveUserOrg } from "../services/user-org.js";

const FB_APP_ID = process.env.FACEBOOK_APP_ID || "";
const FB_APP_SECRET = process.env.FACEBOOK_APP_SECRET || "";
const FB_REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI || "";

/** Verify Facebook signed_request HMAC-SHA256 signature. Returns decoded payload or null if invalid. */
function verifySignedRequest(signedRequest: string): Record<string, unknown> | null {
  if (!FB_APP_SECRET) return null;
  const parts = signedRequest.split(".");
  if (parts.length !== 2) return null;
  const [encodedSig, payload] = parts;
  const expectedSig = crypto
    .createHmac("sha256", FB_APP_SECRET)
    .update(payload)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  if (encodedSig !== expectedSig) return null;
  try {
    const decoded = JSON.parse(
      Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(),
    );
    return decoded as Record<string, unknown>;
  } catch {
    return null;
  }
}
const FB_API_VERSION = "v21.0";

async function fbApi(path: string, token: string, method = "GET", body?: Record<string, unknown>) {
  const url = `https://graph.facebook.com/${FB_API_VERSION}${path}`;
  const opts: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (method === "POST" && body) {
    opts.body = JSON.stringify({ ...body, access_token: token });
  } else if (method === "GET") {
    const sep = path.includes("?") ? "&" : "?";
    return fetch(`${url}${sep}access_token=${token}`).then((r) => r.json());
  }
  return fetch(url, opts).then((r) => r.json());
}

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
        `https://www.facebook.com/${FB_API_VERSION}/dialog/oauth?` +
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

    const tokenUrl =
      `https://graph.facebook.com/${FB_API_VERSION}/oauth/access_token?` +
      `client_id=${FB_APP_ID}` +
      `&client_secret=${FB_APP_SECRET}` +
      `&redirect_uri=${encodeURIComponent(FB_REDIRECT_URI)}` +
      `&code=${code}`;

    const tokenData = (await fetch(tokenUrl).then((r) => r.json())) as {
      access_token: string;
      error?: { message: string };
    };

    if (tokenData.error) {
      return reply.status(400).send({ error: tokenData.error.message });
    }

    // Exchange for long-lived user token
    const longLivedUrl =
      `https://graph.facebook.com/${FB_API_VERSION}/oauth/access_token?` +
      `grant_type=fb_exchange_token` +
      `&client_id=${FB_APP_ID}` +
      `&client_secret=${FB_APP_SECRET}` +
      `&fb_exchange_token=${tokenData.access_token}`;

    const longLivedData = (await fetch(longLivedUrl).then((r) => r.json())) as {
      access_token: string;
    };

    // Get pages the user manages
    const pagesData = (await fbApi("/me/accounts", longLivedData.access_token)) as {
      data: { id: string; name: string; access_token: string }[];
    };

    if (!pagesData.data || pagesData.data.length === 0) {
      return reply.status(400).send({ error: "No Facebook Pages found. Make sure your Facebook account manages at least one Page." });
    }

    // If user manages multiple pages, use the first one for now.
    // The page selection UI can be added later.
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
        fbTokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      })
      .where(eq(schema.organizations.id, userOrg.orgId));

    const frontendUrl = process.env.CORS_ORIGIN || "https://casperevents.org";
    return reply.redirect(`${frontendUrl}/dashboard/facebook?facebook=connected`);
  });

  // Create Facebook Event for an existing event
  app.post(
    "/events/:id/facebook/create-event",
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

      if (event.facebookEventId) {
        return reply.status(400).send({ error: "Facebook Event already exists", facebookEventId: event.facebookEventId });
      }

      const [org] = await db
        .select()
        .from(schema.organizations)
        .where(eq(schema.organizations.id, userOrg.orgId));

      if (!org.facebookPageId || !org.facebookPageToken) {
        return reply.status(400).send({ error: "Facebook Page not connected. Go to Settings to connect your Facebook Page." });
      }

      const fbPayload: Record<string, unknown> = {
        name: event.title,
        start_time: event.startAt.toISOString(),
        description: event.description || undefined,
      };

      if (event.endAt) {
        fbPayload.end_time = event.endAt.toISOString();
      }

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

      if (event.ticketUrl) {
        fbPayload.ticket_uri = event.ticketUrl;
      }

      const fbResult = (await fbApi(
        `/${org.facebookPageId}/events`,
        org.facebookPageToken,
        "POST",
        fbPayload,
      )) as { id?: string; error?: { message: string; code: number; error_subcode?: number } };

      if (fbResult.error) {
        const msg = fbResult.error.message;
        if (fbResult.error.code === 200 || msg.includes("permission")) {
          return reply.status(403).send({
            error: "Your app doesn't have the pages_manage_events permission yet. Complete the Facebook API approval process first.",
            fbError: msg,
          });
        }
        return reply.status(400).send({ error: `Facebook API error: ${msg}`, fbError: msg });
      }

      if (fbResult.id) {
        await db
          .update(schema.events)
          .set({ facebookEventId: fbResult.id, updatedAt: new Date() })
          .where(eq(schema.events.id, id));

        if (event.imageUrl) {
          try {
            const imageFullUrl = event.imageUrl.startsWith("http")
              ? event.imageUrl
              : `https://casperevents.org${event.imageUrl}`;

            await fbApi(
              `/${fbResult.id}/picture`,
              org.facebookPageToken,
              "POST",
              { url: imageFullUrl },
            );
          } catch {
            // cover photo upload is best-effort
          }
        }
      }

      return reply.send({
        success: true,
        facebookEventId: fbResult.id,
        facebookEventUrl: `https://www.facebook.com/events/${fbResult.id}`,
      });
    }
  );

  // Generate default Facebook post text for an event (no auth needed for preview)
  app.get(
    "/events/:id/facebook/preview",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const db = await getDb();
      const userOrg = await resolveUserOrg(db, request.user!.sub);
      if (!userOrg) return reply.status(403).send({ error: "Not authorized" });

      const [event] = await db
        .select()
        .from(schema.events)
        .where(eq(schema.events.id, id));

      if (!event || event.orgId !== userOrg.orgId) {
        return reply.status(404).send({ error: "Event not found" });
      }

      const eventDate = new Date(event.startAt).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });

      const lines = [event.title, "", eventDate];
      if (event.venueName) lines.push(event.venueName);
      if (event.address) lines.push(event.address);
      if (event.isOnline && event.onlineEventUrl) lines.push(`Online: ${event.onlineEventUrl}`);
      lines.push("");
      const plainDesc = event.description
        ? event.description.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim()
        : "";
      if (plainDesc) lines.push(plainDesc.substring(0, 500));
      if (event.ticketUrl) lines.push("", `Tickets: ${event.ticketUrl}`);
      if (event.cost) lines.push(`Cost: ${event.cost}`);

      const eventUrl = `https://casperevents.org/events/${event.id}`;
      lines.push("", `More info: ${eventUrl}`);

      const link = event.facebookEventId
        ? `https://www.facebook.com/events/${event.facebookEventId}`
        : eventUrl;

      return reply.send({
        message: lines.join("\n"),
        link,
        eventUrl,
      });
    }
  );

  // Share event as a page feed post
  app.post(
    "/events/:id/facebook/share",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = (request.body ?? {}) as { message?: string; link?: string };
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
        return reply.status(400).send({ error: "Facebook Page not connected" });
      }

      let message = body.message;
      if (!message) {
        const eventDate = new Date(event.startAt).toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });

        const lines = [event.title, "", eventDate];
        if (event.venueName) lines.push(event.venueName);
        if (event.address) lines.push(event.address);
        if (event.isOnline && event.onlineEventUrl) lines.push(`Online: ${event.onlineEventUrl}`);
        lines.push("");
        const plainDesc = event.description
          ? event.description.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim()
          : "";
        if (plainDesc) lines.push(plainDesc.substring(0, 500));
        if (event.ticketUrl) lines.push("", `Tickets: ${event.ticketUrl}`);
        if (event.cost) lines.push(`Cost: ${event.cost}`);
        lines.push("", `More info: https://casperevents.org/events/${event.id}`);
        message = lines.join("\n");
      }

      const eventUrl = `https://casperevents.org/events/${event.id}`;
      const link = body.link || (event.facebookEventId
        ? `https://www.facebook.com/events/${event.facebookEventId}`
        : eventUrl);

      const postBody: Record<string, unknown> = { message, link };

      const postResult = (await fbApi(
        `/${org.facebookPageId}/feed`,
        org.facebookPageToken,
        "POST",
        postBody,
      )) as { id?: string; error?: { message: string } };

      if (postResult.error) {
        return reply.status(400).send({ error: postResult.error.message });
      }

      return reply.send({ success: true, postId: postResult.id });
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

  // Facebook Deauthorize callback — called when a user removes the app
  app.post("/auth/facebook/deauthorize", async (request, reply) => {
    const { signed_request } = request.body as { signed_request?: string };
    if (!signed_request) {
      return reply.status(400).send({ error: "Missing signed_request" });
    }

    const decoded = verifySignedRequest(signed_request);
    if (!decoded) {
      request.log.warn("Facebook deauthorize: invalid signed_request signature");
      return reply.status(400).send({ error: "Invalid signed_request" });
    }

    const userId = decoded.user_id as string | undefined;
    if (userId) {
      try {
        const db = await getDb();
        await db
          .update(schema.organizations)
          .set({
            facebookPageId: null,
            facebookPageToken: null,
            fbTokenExpiresAt: null,
            updatedAt: new Date(),
          })
          .where(eq(schema.organizations.facebookPageId, userId));
      } catch (err) {
        request.log.warn({ err }, "Facebook deauthorize: cleanup error");
      }
    }

    return reply.send({ success: true });
  });

  // Facebook Data Deletion callback — GDPR compliance
  app.post("/auth/facebook/data-deletion", async (request, reply) => {
    const { signed_request } = request.body as { signed_request?: string };
    if (!signed_request) {
      return reply.status(400).send({ error: "Missing signed_request" });
    }

    const decoded = verifySignedRequest(signed_request);
    if (!decoded) {
      request.log.warn("Facebook data-deletion: invalid signed_request signature");
      return reply.status(400).send({ error: "Invalid signed_request" });
    }

    const userId = decoded.user_id as string | undefined;
    if (userId) {
      try {
        const db = await getDb();
        await db
          .update(schema.organizations)
          .set({
            facebookPageId: null,
            facebookPageToken: null,
            fbTokenExpiresAt: null,
            updatedAt: new Date(),
          })
          .where(eq(schema.organizations.facebookPageId, userId));
      } catch (err) {
        request.log.warn({ err }, "Facebook data-deletion: cleanup error");
      }
    }

    const confirmationCode = `del_${Date.now()}`;
    return reply.send({
      url: "https://casperevents.org/privacy",
      confirmation_code: confirmationCode,
    });
  });
}
