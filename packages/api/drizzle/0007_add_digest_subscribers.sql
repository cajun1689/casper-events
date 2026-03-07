CREATE TABLE IF NOT EXISTS "digest_subscribers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" varchar(255) NOT NULL,
  "preferences" jsonb DEFAULT '{}',
  "active" boolean DEFAULT true NOT NULL,
  "unsubscribe_token" varchar(64) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "digest_subscribers_email_idx" ON "digest_subscribers" ("email");
CREATE INDEX IF NOT EXISTS "digest_subscribers_active_idx" ON "digest_subscribers" ("active");
