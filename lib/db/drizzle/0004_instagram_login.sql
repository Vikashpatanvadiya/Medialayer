-- Move Instagram from Facebook Login (Page tokens) to Instagram Business Login.
-- The Facebook Page columns become optional legacy fields; new connections
-- store an Instagram-scoped user id and a long-lived Instagram user token.

ALTER TABLE "instagram_accounts" ALTER COLUMN "fb_page_id" DROP NOT NULL;
ALTER TABLE "instagram_accounts" ADD COLUMN IF NOT EXISTS "account_type" text;
ALTER TABLE "instagram_accounts" ADD COLUMN IF NOT EXISTS "permissions" text;

-- Publishing an arbitrary media URL isn't tied to a MediaLayer video.
ALTER TABLE "instagram_posts" ALTER COLUMN "video_id" DROP NOT NULL;

-- Single-use OAuth state, so the callback never trusts the browser for identity.
CREATE TABLE IF NOT EXISTS "instagram_oauth_states" (
  "state" text PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "expires_at" timestamp NOT NULL,
  "used_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "instagram_oauth_states_expires_idx"
  ON "instagram_oauth_states" ("expires_at");
