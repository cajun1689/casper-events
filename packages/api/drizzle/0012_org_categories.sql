-- Org-specific sub-categories under platform categories
CREATE TABLE IF NOT EXISTS "org_categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "parent_category_id" uuid NOT NULL REFERENCES "categories"("id") ON DELETE CASCADE,
  "name" varchar(100) NOT NULL,
  "slug" varchar(100) NOT NULL,
  "icon" varchar(50),
  "color" varchar(7),
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "org_categories_org_id_idx" ON "org_categories" ("org_id");
CREATE INDEX IF NOT EXISTS "org_categories_parent_idx" ON "org_categories" ("parent_category_id");
CREATE UNIQUE INDEX IF NOT EXISTS "org_categories_org_slug_idx" ON "org_categories" ("org_id", "slug");

-- Event to org category junction
CREATE TABLE IF NOT EXISTS "event_org_categories" (
  "event_id" uuid NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
  "org_category_id" uuid NOT NULL REFERENCES "org_categories"("id") ON DELETE CASCADE,
  PRIMARY KEY ("event_id", "org_category_id")
);

-- Per-parent display mode for embed: parent only, subs only, or both
ALTER TABLE "embed_configs" ADD COLUMN IF NOT EXISTS "category_display_mode" jsonb DEFAULT '{}';
