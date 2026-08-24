-- Destination/format per submission, plus reminder-only scheduling.
ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "destination" text NOT NULL DEFAULT 'youtube';
ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "format" text NOT NULL DEFAULT 'video';
ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "scheduled_at" timestamp;
ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "schedule_timezone" text;
ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "reminder_morning_sent_at" timestamp;
ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "reminder_due_sent_at" timestamp;

-- Calendar queries filter by window; reminders scan for due rows.
CREATE INDEX IF NOT EXISTS "videos_scheduled_at_idx" ON "videos" ("scheduled_at");
