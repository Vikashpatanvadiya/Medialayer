import { pgTable, text, timestamp, uuid, integer, bigint } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const videosTable = pgTable("videos", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  tags: text("tags").array(),
  videoUrl: text("video_url").notNull(),
  /**
   * What the editor submitted. "video" covers YouTube uploads and Instagram
   * Reels; "image" is a photo for an Instagram feed post.
   */
  mediaType: text("media_type", { enum: ["video", "image"] }).notNull().default("video"),
  /** Where this submission is headed, chosen by the editor at submission time. */
  destination: text("destination", { enum: ["youtube", "instagram"] })
    .notNull()
    .default("youtube"),
  /** youtube → video | short, instagram → reel | post */
  format: text("format", { enum: ["video", "short", "reel", "post"] })
    .notNull()
    .default("video"),
  /** Planned publish moment (UTC). Reminders only — nothing auto-publishes. */
  scheduledAt: timestamp("scheduled_at"),
  /** IANA zone the schedule was set in, so reminders read in the right local time. */
  scheduleTimezone: text("schedule_timezone"),
  /** Set once each reminder has been raised; cleared when the schedule changes. */
  reminderMorningSentAt: timestamp("reminder_morning_sent_at"),
  reminderDueSentAt: timestamp("reminder_due_sent_at"),
  storedFilename: text("stored_filename"),
  thumbnailUrl: text("thumbnail_url"),
  status: text("status", { enum: ["pending", "approved", "rejected", "uploaded"] }).notNull().default("pending"),
  creatorId: uuid("creator_id").notNull().references(() => usersTable.id),
  editorId: uuid("editor_id").notNull().references(() => usersTable.id),
  rejectionFeedback: text("rejection_feedback"),
  fileSize: integer("file_size"),
  duration: integer("duration"),
  youtubeVideoId: text("youtube_video_id"),
  youtubeUrl: text("youtube_url"),
  // Solana editor payment fields
  editorBountyLamports: bigint("editor_bounty_lamports", { mode: "number" }),
  editorPaymentTxSig: text("editor_payment_tx_sig"),
  editorPaymentStatus: text("editor_payment_status", { enum: ["none", "pending", "paid", "failed"] }).default("none"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Video = typeof videosTable.$inferSelect;
