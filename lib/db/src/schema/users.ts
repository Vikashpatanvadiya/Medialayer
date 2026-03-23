import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["creator", "editor"] }).notNull(),
  inviteCode: text("invite_code").unique(),
  youtubeTokens: jsonb("youtube_tokens").$type<{
    access_token: string;
    refresh_token: string;
    expiry_date: number;
  } | null>().default(null),
  youtubeChannelName: text("youtube_channel_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
