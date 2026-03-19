import { pgTable, text, timestamp, uuid, real, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const videosTable = pgTable("videos", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  tags: json("tags").$type<string[]>().default([]),
  videoUrl: text("video_url").notNull(),
  storedFilename: text("stored_filename"),
  thumbnailUrl: text("thumbnail_url"),
  status: text("status", { enum: ["pending", "approved", "rejected", "uploaded"] })
    .notNull()
    .default("pending"),
  creatorId: uuid("creator_id")
    .notNull()
    .references(() => usersTable.id),
  editorId: uuid("editor_id")
    .notNull()
    .references(() => usersTable.id),
  rejectionFeedback: text("rejection_feedback"),
  fileSize: real("file_size"),
  duration: real("duration"),
  youtubeVideoId: text("youtube_video_id"),
  youtubeUrl: text("youtube_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertVideoSchema = createInsertSchema(videosTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  rejectionFeedback: true,
  youtubeVideoId: true,
  youtubeUrl: true,
});
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Video = typeof videosTable.$inferSelect;
