CREATE TABLE IF NOT EXISTS "instagram_accounts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "instagram_id" text NOT NULL,
  "username" text NOT NULL,
  "profile_picture_url" text,
  "fb_page_id" text NOT NULL,
  "fb_page_name" text,
  "access_token" text NOT NULL,
  "token_expires_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- One row per IG account per user; reconnecting updates the existing row.
CREATE UNIQUE INDEX IF NOT EXISTS "instagram_accounts_user_ig_idx"
  ON "instagram_accounts" ("user_id", "instagram_id");

CREATE TABLE IF NOT EXISTS "instagram_posts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "video_id" uuid NOT NULL REFERENCES "videos"("id") ON DELETE CASCADE,
  "instagram_account_id" uuid NOT NULL REFERENCES "instagram_accounts"("id") ON DELETE CASCADE,
  "published_by_id" uuid NOT NULL REFERENCES "users"("id"),
  "post_type" text NOT NULL,
  "instagram_post_id" text,
  "permalink" text,
  "caption" text DEFAULT '' NOT NULL,
  "cover_url" text,
  "status" text DEFAULT 'PENDING' NOT NULL,
  "error_message" text,
  "published_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "instagram_posts_video_idx" ON "instagram_posts" ("video_id");
