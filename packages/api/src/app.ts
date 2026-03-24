import Fastify from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import { ZodError } from "zod";
import { eventRoutes } from "./routes/events.js";
import { organizationRoutes } from "./routes/organizations.js";
import { adminRoutes } from "./routes/admin.js";
import { authRoutes } from "./routes/auth.js";
import { embedRoutes } from "./routes/embed.js";
import { facebookRoutes } from "./routes/facebook.js";
import { googleCalendarRoutes } from "./routes/google-calendar.js";
import { icalRoutes } from "./routes/ical.js";
import { uploadRoutes } from "./routes/upload.js";
import { venueRoutes } from "./routes/venues.js";
import { sponsorRoutes } from "./routes/sponsors.js";
import { orgCategoryRoutes } from "./routes/org-categories.js";
import { publicEventRoutes } from "./routes/public-events.js";
import { digestRoutes } from "./routes/digest.js";
import { siteSponsorsRoutes } from "./routes/site-sponsors.js";
import { pushRoutes } from "./routes/push.js";

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  app.register(cors, {
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  });

  app.register(sensible);

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      const messages = error.issues.map(
        (i) => `${i.path.join(".")}: ${i.message}`,
      );
      return reply.status(400).send({
        error: "Validation failed",
        details: messages,
      });
    }
    request.log.error(error);
    return reply.status(error.statusCode ?? 500).send({
      error: error.message || "Internal server error",
    });
  });

  app.get("/health", async () => ({ status: "ok", timestamp: new Date().toISOString() }));

  app.register(authRoutes);
  app.register(eventRoutes);
  app.register(sponsorRoutes, { prefix: "/events" });
  app.register(organizationRoutes);
  app.register(orgCategoryRoutes);
  app.register(adminRoutes);
  app.register(embedRoutes);
  app.register(facebookRoutes);
  app.register(googleCalendarRoutes);
  app.register(icalRoutes);
  app.register(uploadRoutes);
  app.register(venueRoutes);
  app.register(publicEventRoutes);
  app.register(digestRoutes);
  app.register(siteSponsorsRoutes);
  app.register(pushRoutes);

  return app;
}
