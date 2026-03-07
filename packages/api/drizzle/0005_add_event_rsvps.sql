CREATE TABLE IF NOT EXISTS "event_rsvps" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "event_id" uuid NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
  "email" varchar(255) NOT NULL,
  "user_id" uuid REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "event_rsvps_event_id_idx" ON "event_rsvps" ("event_id");
CREATE UNIQUE INDEX IF NOT EXISTS "event_rsvps_event_email_idx" ON "event_rsvps" ("event_id", "email");
