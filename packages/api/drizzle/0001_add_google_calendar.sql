-- Add google_calendar_import to event_source enum
ALTER TYPE event_source ADD VALUE IF NOT EXISTS 'google_calendar_import';

-- Add Google Calendar fields to organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS google_calendar_id VARCHAR(500);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS google_token_expires_at TIMESTAMPTZ;

-- Add Google Calendar event ID to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS google_calendar_event_id VARCHAR(500);
