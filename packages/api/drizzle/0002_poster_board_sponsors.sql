-- Poster Board Embed Mode: event_sponsors table + new event columns
-- Additive migration - safe to run on existing DB

CREATE TYPE "public"."sponsor_level" AS ENUM('presenting', 'gold', 'silver', 'bronze', 'community');--> statement-breakpoint
CREATE TABLE "event_sponsors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"logo_url" varchar(500),
	"website_url" varchar(500),
	"level" "sponsor_level" DEFAULT 'community' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "color" varchar(25);--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "subtitle" varchar(255);--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "external_url" varchar(500);--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "external_url_text" varchar(100);--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "external_url_caption" varchar(255);--> statement-breakpoint
ALTER TABLE "event_sponsors" ADD CONSTRAINT "event_sponsors_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_sponsors_event_id_idx" ON "event_sponsors" USING btree ("event_id");
