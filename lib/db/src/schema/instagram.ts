import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { videosTable } from "./videos";

/**
 * An Instagram Professional (Business/Creator) account connected through
 * Instagram Business Login — no Facebook Page involved.
 *
 * `accessToken` holds the long-lived Instagram user token, encrypted at rest
 * with the same helper used for YouTube tokens (backend/src/lib/crypto.ts).
 */
export const instagramAccountsTable = pgTable("instagram_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  /** Instagram-scoped user id returned by the Instagram Login token exchange. */
  instagramId: text("instagram_id").notNull(),
  username: text("username").notNull(),
  profilePictureUrl: text("profile_picture_url"),
  /** BUSINESS | MEDIA_CREATOR — reported by the Instagram API. */
  accountType: text("account_type"),
  /** Space-separated scopes the user actually granted. */
  permissions: text("permissions"),
  accessToken: text("access_token").notNull(),
  tokenExpiresAt: timestamp("token_expires_at"),
  /**
   * Legacy columns from the previous Facebook-Login implementation. Kept
   * nullable so existing rows survive; unused by Instagram Business Login.
   */
  fbPageId: text("fb_page_id"),
  fbPageName: text("fb_page_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type InstagramAccount = typeof instagramAccountsTable.$inferSelect;

/**
 * Single-use OAuth state. Stored server-side so the callback can prove which
 * MediaLayer user started the flow without trusting anything from the browser.
 */
export const instagramOauthStatesTable = pgTable("instagram_oauth_states", {
  state: text("state").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type InstagramOauthState = typeof instagramOauthStatesTable.$inferSelect;

/** One publish attempt of a video to Instagram — pending, published or failed. */
export const instagramPostsTable = pgTable("instagram_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** Null when publishing a media URL that isn't a MediaLayer video. */
  videoId: uuid("video_id").references(() => videosTable.id, { onDelete: "cascade" }),
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
