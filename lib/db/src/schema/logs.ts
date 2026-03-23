import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const logsTable = pgTable("logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id),
  action: text("action").notNull(), // e.g. "upload_started", "upload_completed", "submitted_for_review", "approved", "rejected", "rollback"
  videoId: uuid("video_id"),        // optional, linked video
  meta: jsonb("meta"),              // any extra context (filename, size, etc.)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Log = typeof logsTable.$inferSelect;
