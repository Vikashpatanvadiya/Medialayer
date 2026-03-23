import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { videosTable } from "./videos";

export const notificationsTable = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // "video_pending" | "video_approved" | "video_rejected" | "video_uploaded"
  videoId: uuid("video_id").references(() => videosTable.id, { onDelete: "set null" }),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Notification = typeof notificationsTable.$inferSelect;
