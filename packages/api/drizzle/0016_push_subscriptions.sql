CREATE TABLE IF NOT EXISTS "push_subscriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid REFERENCES "users"("id") ON DELETE CASCADE,
  "expo_push_token" varchar(255) NOT NULL,
  "platform" varchar(10) NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "push_subscriptions_token_idx" ON "push_subscriptions" ("expo_push_token");
CREATE INDEX IF NOT EXISTS "push_subscriptions_platform_idx" ON "push_subscriptions" ("platform");

CREATE TABLE IF NOT EXISTS "push_subscription_orgs" (
  "subscription_id" uuid NOT NULL REFERENCES "push_subscriptions"("id") ON DELETE CASCADE,
  "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  PRIMARY KEY ("subscription_id", "org_id")
);
