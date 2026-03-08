ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "require_google_event_approval" boolean DEFAULT false NOT NULL;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "publish_at" timestamp with time zone;
