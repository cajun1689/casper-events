import Fastify from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import { eventRoutes } from "./routes/events.js";
import { organizationRoutes } from "./routes/organizations.js";
import { adminRoutes } from "./routes/admin.js";
import { authRoutes } from "./routes/auth.js";
import { embedRoutes } from "./routes/embed.js";
import { facebookRoutes } from "./routes/facebook.js";
import { icalRoutes } from "./routes/ical.js";
import { uploadRoutes } from "./routes/upload.js";
import { venueRoutes } from "./routes/venues.js";

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  app.register(cors, {
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  });

  app.register(sensible);

  app.get("/health", async () => ({ status: "ok", timestamp: new Date().toISOString() }));

  app.register(authRoutes);
  app.register(eventRoutes);
  app.register(organizationRoutes);
  app.register(adminRoutes);
  app.register(embedRoutes);
  app.register(facebookRoutes);
  app.register(icalRoutes);
  app.register(uploadRoutes);
  app.register(venueRoutes);

  return app;
}
