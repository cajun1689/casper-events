CREATE TABLE IF NOT EXISTS "app_settings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "key" varchar(100) NOT NULL,
  "value" text NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "app_settings_key_idx" ON "app_settings" ("key");

CREATE TABLE IF NOT EXISTS "invite_codes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "code" varchar(64) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "used_at" timestamp with time zone,
  "used_by_org_id" uuid REFERENCES "organizations"("id") ON DELETE SET NULL,
  "created_by" uuid REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "invite_codes_code_idx" ON "invite_codes" ("code");
CREATE INDEX IF NOT EXISTS "invite_codes_used_at_idx" ON "invite_codes" ("used_at");

INSERT INTO "app_settings" ("key", "value") VALUES ('require_invite_code', 'true')
ON CONFLICT ("key") DO NOTHING;
