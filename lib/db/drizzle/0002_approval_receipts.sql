CREATE TABLE IF NOT EXISTS "approval_receipts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "video_id" uuid NOT NULL REFERENCES "videos"("id"),
  "approver_id" uuid NOT NULL REFERENCES "users"("id"),
  "version" integer NOT NULL,
  "tx_signature" text,
  "video_hash" text NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "error_message" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
