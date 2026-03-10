-- Extend events.color to support gradient strings (e.g. linear-gradient(...))
ALTER TABLE "events" ALTER COLUMN "color" TYPE varchar(200);
