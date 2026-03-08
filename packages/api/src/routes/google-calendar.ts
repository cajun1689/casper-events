import { FastifyInstance } from "fastify";
import { eq, and, isNotNull } from "drizzle-orm";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import * as schema from "@cyh/shared/db";
import { getDb } from "../db/connection.js";
import { requireAuth } from "../middleware/auth.js";
import { resolveUserOrg } from "../services/user-org.js";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "";
const MEDIA_BUCKET = process.env.MEDIA_BUCKET || "casperevents-media";
const CDN_DOMAIN = process.env.CDN_DOMAIN || "";

const s3 = new S3Client({});

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/drive.readonly",
];

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  error?: string;
  error_description?: string;
}

interface GoogleCalendarListResponse {
  items?: {
    id: string;
    summary: string;
    primary?: boolean;
    accessRole: string;
    backgroundColor?: string;
  }[];
}

interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  location?: string;
  attachments?: {
    fileUrl: string;
    title: string;
    mimeType: string;
    fileId?: string;
  }[];
  htmlLink?: string;
  status?: string;
}

interface GoogleEventsListResponse {
  items?: GoogleCalendarEvent[];
  nextPageToken?: string;
}

async function exchangeRefreshToken(refreshToken: string): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = (await res.json()) as GoogleTokenResponse;
  if (data.error) throw new Error(data.error_description || data.error);
  return data.access_token;
}

async function googleApi<T>(
  path: string,
  accessToken: string,
  params?: Record<string, string>
): Promise<T> {
  const url = new URL(`https://www.googleapis.com${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.json() as Promise<T>;
}

async function downloadAndUploadImage(
  fileUrl: string,
  accessToken: string,
  fileId?: string
): Promise<string | null> {
  try {
    let imageBuffer: Buffer;
    let contentType = "image/jpeg";

    if (fileId) {
      const driveRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!driveRes.ok) return null;
      contentType = driveRes.headers.get("content-type") || "image/jpeg";
      imageBuffer = Buffer.from(await driveRes.arrayBuffer());
    } else {
      const res = await fetch(fileUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return null;
      contentType = res.headers.get("content-type") || "image/jpeg";
      imageBuffer = Buffer.from(await res.arrayBuffer());
    }

    if (!contentType.startsWith("image/")) return null;
    if (imageBuffer.length > 10 * 1024 * 1024) return null;

    const ext = contentType.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
    const key = `media/events/${randomUUID()}.${ext}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: MEDIA_BUCKET,
        Key: key,
        Body: imageBuffer,
        ContentType: contentType,
      })
    );

    return CDN_DOMAIN ? `https://${CDN_DOMAIN}/${key}` : `/${key}`;
  } catch {
    return null;
  }
}

function extractFileId(url: string): string | undefined {
  const match = url.match(/\/d\/([^/]+)/);
  return match?.[1];
}

export async function syncGoogleCalendarEvents(
  db: Awaited<ReturnType<typeof getDb>>,
  org: typeof schema.organizations.$inferSelect
) {
  if (!org.googleRefreshToken || !org.googleCalendarId) return;

  const accessToken = await exchangeRefreshToken(org.googleRefreshToken);

  const now = new Date();
  const timeMin = now.toISOString();
  const timeMax = new Date(
    now.getTime() + 90 * 24 * 60 * 60 * 1000
  ).toISOString();

  let pageToken: string | undefined;
  do {
    const params: Record<string, string> = {
      timeMin,
      timeMax,
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "100",
    };
    if (pageToken) params.pageToken = pageToken;

    const data = await googleApi<GoogleEventsListResponse>(
      `/calendar/v3/calendars/${encodeURIComponent(org.googleCalendarId)}/events`,
      accessToken,
      params
    );

    if (!data.items) break;

    for (const gEvent of data.items) {
      if (gEvent.status === "cancelled" || !gEvent.summary) continue;

      const existing = await db
        .select({ id: schema.events.id })
        .from(schema.events)
        .where(eq(schema.events.googleCalendarEventId, gEvent.id));

      if (existing.length > 0) {
        await db
          .update(schema.events)
          .set({
            title: gEvent.summary,
            description: gEvent.description || null,
            startAt: new Date(
              gEvent.start?.dateTime || gEvent.start?.date || now
            ),
            endAt: gEvent.end?.dateTime
              ? new Date(gEvent.end.dateTime)
              : gEvent.end?.date
                ? new Date(gEvent.end.date)
                : null,
            address: gEvent.location || null,
            allDay: !gEvent.start?.dateTime,
            updatedAt: new Date(),
          })
          .where(eq(schema.events.googleCalendarEventId, gEvent.id));
        continue;
      }

      let imageUrl: string | null = null;
      if (gEvent.attachments?.length) {
        for (const att of gEvent.attachments) {
          if (att.mimeType?.startsWith("image/")) {
            const fileId = att.fileId || extractFileId(att.fileUrl);
            imageUrl = await downloadAndUploadImage(
              att.fileUrl,
              accessToken,
              fileId
            );
            if (imageUrl) break;
          }
        }
      }

      const initialStatus = org.requireGoogleEventApproval ? "draft" : "published";
      await db.insert(schema.events).values({
        orgId: org.id,
        title: gEvent.summary,
        description: gEvent.description || null,
        startAt: new Date(
          gEvent.start?.dateTime || gEvent.start?.date || now
        ),
        endAt: gEvent.end?.dateTime
          ? new Date(gEvent.end.dateTime)
          : gEvent.end?.date
            ? new Date(gEvent.end.date)
            : null,
        allDay: !gEvent.start?.dateTime,
        address: gEvent.location || null,
        imageUrl,
        googleCalendarEventId: gEvent.id,
        source: "google_calendar_import",
        status: initialStatus,
      });
    }

    pageToken = data.nextPageToken;
  } while (pageToken);
}

export async function googleCalendarRoutes(app: FastifyInstance) {
  app.get(
    "/auth/google/connect",
    { preHandler: requireAuth },
    async (request, reply) => {
      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: GOOGLE_REDIRECT_URI,
        response_type: "code",
        scope: SCOPES.join(" "),
        access_type: "offline",
        prompt: "consent",
        state: request.user!.sub,
      });

      return reply.send({
        url: `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
      });
    }
  );

  app.get("/auth/google/callback", async (request, reply) => {
    const { code, state: cognitoSub } = request.query as {
      code: string;
      state: string;
    };

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = (await tokenRes.json()) as GoogleTokenResponse;

    if (tokenData.error) {
      return reply.status(400).send({ error: tokenData.error_description || tokenData.error });
    }

    if (!tokenData.refresh_token) {
      return reply.status(400).send({
        error: "No refresh token received. Please revoke access at https://myaccount.google.com/permissions and try again.",
      });
    }

    const calendars = await googleApi<GoogleCalendarListResponse>(
      "/calendar/v3/users/me/calendarList",
      tokenData.access_token
    );

    const primaryCal = calendars.items?.find((c) => c.primary);
    const calendarId = primaryCal?.id || "primary";

    const db = await getDb();
    const userOrg = await resolveUserOrg(db, cognitoSub);

    if (!userOrg) {
      return reply.status(403).send({ error: "No organization found" });
    }

    await db
      .update(schema.organizations)
      .set({
        googleRefreshToken: tokenData.refresh_token,
        googleCalendarId: calendarId,
        googleTokenExpiresAt: new Date(
          Date.now() + tokenData.expires_in * 1000
        ),
        updatedAt: new Date(),
      })
      .where(eq(schema.organizations.id, userOrg.orgId));

    const frontendUrl = process.env.CORS_ORIGIN || "https://casperevents.org";
    return reply.redirect(
      `${frontendUrl}/dashboard/google-calendar?google=connected`
    );
  });

  app.get(
    "/google-calendar/settings",
    { preHandler: requireAuth },
    async (request, reply) => {
      const db = await getDb();
      const userOrg = await resolveUserOrg(db, request.user!.sub);
      if (!userOrg) {
        return reply.status(403).send({ error: "No organization found" });
      }
      const [org] = await db
        .select({ requireGoogleEventApproval: schema.organizations.requireGoogleEventApproval })
        .from(schema.organizations)
        .where(eq(schema.organizations.id, userOrg.orgId));
      return reply.send({
        requireGoogleEventApproval: org?.requireGoogleEventApproval ?? false,
      });
    }
  );

  app.put(
    "/google-calendar/settings",
    { preHandler: requireAuth },
    async (request, reply) => {
      const db = await getDb();
      const userOrg = await resolveUserOrg(db, request.user!.sub);
      if (!userOrg) {
        return reply.status(403).send({ error: "No organization found" });
      }
      const { requireGoogleEventApproval } = request.body as { requireGoogleEventApproval?: boolean };
      await db
        .update(schema.organizations)
        .set({
          requireGoogleEventApproval: requireGoogleEventApproval ?? false,
          updatedAt: new Date(),
        })
        .where(eq(schema.organizations.id, userOrg.orgId));
      return reply.send({ requireGoogleEventApproval: !!requireGoogleEventApproval });
    }
  );

  app.get(
    "/google-calendar/status",
    { preHandler: requireAuth },
    async (request, reply) => {
      const db = await getDb();
      const userOrg = await resolveUserOrg(db, request.user!.sub);
      if (!userOrg) {
        return reply.send({ connected: false, calendarId: null });
      }

      const [org] = await db
        .select()
        .from(schema.organizations)
        .where(eq(schema.organizations.id, userOrg.orgId));

      if (!org?.googleRefreshToken) {
        return reply.send({ connected: false, calendarId: null });
      }

      return reply.send({
        connected: true,
        calendarId: org.googleCalendarId,
      });
    }
  );

  app.get(
    "/google-calendar/calendars",
    { preHandler: requireAuth },
    async (request, reply) => {
      const db = await getDb();
      const userOrg = await resolveUserOrg(db, request.user!.sub);
      if (!userOrg) {
        return reply.status(403).send({ error: "No organization found" });
      }

      const [org] = await db
        .select()
        .from(schema.organizations)
        .where(eq(schema.organizations.id, userOrg.orgId));

      if (!org?.googleRefreshToken) {
        return reply.status(400).send({ error: "Google Calendar not connected" });
      }

      const accessToken = await exchangeRefreshToken(org.googleRefreshToken);
      const calendars = await googleApi<GoogleCalendarListResponse>(
        "/calendar/v3/users/me/calendarList",
        accessToken
      );

      return reply.send({
        calendars:
          calendars.items?.map((c) => ({
            id: c.id,
            name: c.summary,
            primary: c.primary || false,
            color: c.backgroundColor,
          })) || [],
        selectedCalendarId: org.googleCalendarId,
      });
    }
  );

  app.put(
    "/google-calendar/calendar",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { calendarId } = request.body as { calendarId: string };
      const db = await getDb();
      const userOrg = await resolveUserOrg(db, request.user!.sub);
      if (!userOrg) {
        return reply.status(403).send({ error: "No organization found" });
      }

      await db
        .update(schema.organizations)
        .set({
          googleCalendarId: calendarId,
          updatedAt: new Date(),
        })
        .where(eq(schema.organizations.id, userOrg.orgId));

      return reply.send({ success: true, calendarId });
    }
  );

  app.post(
    "/google-calendar/sync",
    { preHandler: requireAuth },
    async (request, reply) => {
      const db = await getDb();
      const userOrg = await resolveUserOrg(db, request.user!.sub);
      if (!userOrg) {
        return reply.status(403).send({ error: "No organization found" });
      }

      const [org] = await db
        .select()
        .from(schema.organizations)
        .where(eq(schema.organizations.id, userOrg.orgId));

      if (!org?.googleRefreshToken || !org?.googleCalendarId) {
        return reply
          .status(400)
          .send({ error: "Google Calendar not connected" });
      }

      await syncGoogleCalendarEvents(db, org);
      return reply.send({ success: true });
    }
  );

  app.delete(
    "/google-calendar/disconnect",
    { preHandler: requireAuth },
    async (request, reply) => {
      const db = await getDb();
      const userOrg = await resolveUserOrg(db, request.user!.sub);
      if (!userOrg) {
        return reply.status(403).send({ error: "No organization found" });
      }

      const [org] = await db
        .select()
        .from(schema.organizations)
        .where(eq(schema.organizations.id, userOrg.orgId));

      if (org?.googleRefreshToken) {
        try {
          await fetch(
            `https://oauth2.googleapis.com/revoke?token=${org.googleRefreshToken}`,
            { method: "POST" }
          );
        } catch {
          // best-effort revocation
        }
      }

      await db
        .update(schema.organizations)
        .set({
          googleRefreshToken: null,
          googleCalendarId: null,
          googleTokenExpiresAt: null,
          updatedAt: new Date(),
        })
        .where(eq(schema.organizations.id, userOrg.orgId));

      return reply.send({ success: true });
    }
  );
}
