-- Add cta_opens_external to embed_configs for poster CTA behavior
ALTER TABLE "embed_configs" ADD COLUMN IF NOT EXISTS "cta_opens_external" boolean DEFAULT false NOT NULL;
