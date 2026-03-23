import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const videosTable = pgTable("videos", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  tags: text("tags").array(),
  videoUrl: text("video_url").notNull(),
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Video = typeof videosTable.$inferSelect;
