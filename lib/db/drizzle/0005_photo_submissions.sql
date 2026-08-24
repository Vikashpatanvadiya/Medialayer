-- Editors can submit photos as well as videos. Existing rows are all videos.
ALTER TABLE "videos"
  ADD COLUMN IF NOT EXISTS "media_type" text NOT NULL DEFAULT 'video';
