import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { videosTable } from "./videos";

/**
 * An Instagram Business/Creator account connected by a MediaLayer creator,
 * reached through the Facebook Page that owns it.
 *
 * `accessToken` holds the long-lived Page access token, encrypted at rest with
 * the same helper used for YouTube tokens (see backend/src/lib/crypto.ts).
 */
export const instagramAccountsTable = pgTable("instagram_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  instagramId: text("instagram_id").notNull(),
  username: text("username").notNull(),
  profilePictureUrl: text("profile_picture_url"),
  fbPageId: text("fb_page_id").notNull(),
  fbPageName: text("fb_page_name"),
  accessToken: text("access_token").notNull(),
  tokenExpiresAt: timestamp("token_expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type InstagramAccount = typeof instagramAccountsTable.$inferSelect;

/** One publish attempt of a video to Instagram — pending, published or failed. */
export const instagramPostsTable = pgTable("instagram_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  videoId: uuid("video_id")
    .notNull()
    .references(() => videosTable.id, { onDelete: "cascade" }),
  instagramAccountId: uuid("instagram_account_id")
    .notNull()
    .references(() => instagramAccountsTable.id, { onDelete: "cascade" }),
  publishedById: uuid("published_by_id")
    .notNull()
    .references(() => usersTable.id),
  postType: text("post_type", { enum: ["REELS", "FEED"] }).notNull(),
  instagramPostId: text("instagram_post_id"),
  permalink: text("permalink"),
  caption: text("caption").notNull().default(""),
  coverUrl: text("cover_url"),
  status: text("status", { enum: ["PENDING", "PUBLISHED", "FAILED"] })
    .notNull()
    .default("PENDING"),
  errorMessage: text("error_message"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type InstagramPost = typeof instagramPostsTable.$inferSelect;
