ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "submitter_email" varchar(255);
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "submitter_name" varchar(255);
