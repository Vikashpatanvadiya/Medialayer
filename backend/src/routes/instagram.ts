import { Router, type IRouter } from "express";
import { randomBytes } from "crypto";
import { and, desc, eq, isNull, lt } from "drizzle-orm";
import {
  db,
  instagramAccountsTable,
  instagramOauthStatesTable,
  instagramPostsTable,
  notificationsTable,
  videosTable,
} from "@workspace/db";
import { requireAuth, requireRole } from "../lib/auth.js";
import { encrypt, decrypt } from "../lib/crypto.js";
import { logAction } from "../lib/logger.js";
import { getSignedUrl, getSignedUrlFromPublicId } from "../lib/cloudinary.js";
import {
  InstagramApiError,
  createMediaContainer,
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  getInstagramAuthUrl,
  getInstagramProfile,
  getMediaPermalink,
  isInstagramConfigured,
  instagramConfig,
  publishContainer,
  validateRedirectUri,
  waitForContainer,
  type PostType,
} from "../lib/instagram.js";

const router: IRouter = Router();

// Surface the effective Instagram config once at boot — misconfiguration is far
// easier to spot in the startup log than after a failed click.
(function reportInstagramConfig() {
  const { redirectUri } = instagramConfig();
  if (!isInstagramConfigured()) {
    console.warn(
      "[instagram] Not configured — set INSTAGRAM_CLIENT_ID and INSTAGRAM_CLIENT_SECRET to enable publishing.",
    );
    return;
  }
  const problem = validateRedirectUri(redirectUri);
  console.log(
    problem
      ? `[instagram] ⚠️  Redirect URI is invalid: ${problem}`
      : `[instagram] Ready. Redirect URI: ${redirectUri}`,
  );
  // App IDs are public. Printing it is the fastest way to catch the documented
  // failure mode: the Facebook App ID sitting in INSTAGRAM_CLIENT_ID.
  console.log(
    `[instagram] Using client_id: ${instagramConfig().clientId} ` +
      "(must be the Instagram app ID from Instagram → API setup with Instagram login, " +
      "NOT the Meta/Facebook App ID)",
  );
})();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
/** Where the creator lands after the Instagram round trip. */
const RETURN_PATH = process.env.INSTAGRAM_RETURN_PATH || "/dashboard/profile";
const MAX_CAPTION_LENGTH = 2200;
const STATE_TTL_MS = 10 * 60 * 1000;

// ── OAuth state (server-side, single use) ────────────────────────────────────

async function createState(userId: string): Promise<string> {
  const state = randomBytes(32).toString("hex");
  await db.insert(instagramOauthStatesTable).values({
    state,
    userId,
    expiresAt: new Date(Date.now() + STATE_TTL_MS),
  });
  // Opportunistic cleanup so the table can't grow without bound.
  await db
    .delete(instagramOauthStatesTable)
    .where(lt(instagramOauthStatesTable.expiresAt, new Date(Date.now() - STATE_TTL_MS)))
    .catch(() => {});
  return state;
}

/** Consumes a state exactly once; returns the user it was issued to. */
async function consumeState(state: string): Promise<string | null> {
  if (!state) return null;
  const [row] = await db
    .update(instagramOauthStatesTable)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(instagramOauthStatesTable.state, state),
        // Single use: only an unconsumed row is updated, so a replayed
        // callback matches nothing and returns null.
        isNull(instagramOauthStatesTable.usedAt),
      ),
    )
    .returning();

  if (!row) return null;
  if (row.expiresAt.getTime() < Date.now()) return null;
  return row.userId;
}

function frontendRedirect(params: Record<string, string>): string {
  const url = new URL(RETURN_PATH, FRONTEND_URL);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return url.toString();
}

function publicAccount(row: typeof instagramAccountsTable.$inferSelect) {
  // Never expose the access token to the client.
  return {
    id: row.id,
    instagramUserId: row.instagramId,
    username: row.username,
    profilePictureUrl: row.profilePictureUrl,
    accountType: row.accountType,
    connectedAt: row.createdAt,
    tokenExpiresAt: row.tokenExpiresAt,
  };
}

// ── Connection ───────────────────────────────────────────────────────────────

/**
 * GET /api/integrations/instagram/connect
 * Builds the Instagram authorization URL (state issued server-side). Returns
 * JSON by default so the Bearer-authenticated frontend can navigate to it;
 * ?redirect=1 issues a 302 for non-XHR callers.
 */
router.get("/connect", requireAuth, requireRole("creator"), async (req, res) => {
  if (!isInstagramConfigured()) {
    res.status(503).json({
      error:
        "Instagram publishing is not configured on this server (INSTAGRAM_CLIENT_ID / INSTAGRAM_CLIENT_SECRET).",
    });
    return;
  }

  const { redirectUri } = instagramConfig();
  const problem = validateRedirectUri(redirectUri);
  if (problem) {
    console.error(`[instagram] Invalid redirect URI: ${problem}`);
    res.status(500).json({ error: problem });
    return;
  }

  const state = await createState(req.user!.userId);
  const url = getInstagramAuthUrl(state);
  console.log(`[instagram] OAuth started for user ${req.user!.userId}`);

  if (req.query.redirect === "1") {
    res.redirect(url);
    return;
  }
  res.json({ url });
});

/**
 * GET /api/integrations/instagram/callback
 * Instagram redirects the creator here. Always ends in a redirect back to the
 * frontend so the user never sees a bare API response.
 */
router.get("/callback", async (req, res) => {
  const { code, state, error_description: errorDescription, error, error_reason: errorReason } =
    req.query as Record<string, string | undefined>;

  console.log("[instagram] OAuth callback received");

  if (error || errorReason) {
    const cancelled = /denied|cancel/i.test(`${error}${errorReason}${errorDescription}`);
    res.redirect(
      frontendRedirect({
        instagram: "error",
        reason: cancelled ? "cancelled" : "denied",
      }),
    );
    return;
  }

  if (!code || !state) {
    res.redirect(frontendRedirect({ instagram: "error", reason: "missing_code" }));
    return;
  }

  let userId: string | null;
  try {
    userId = await consumeState(state);
  } catch (err: any) {
    // A database problem must still land the creator back in the app.
    console.error(`[instagram] State lookup failed: ${err?.message || "database error"}`);
    res.redirect(frontendRedirect({ instagram: "error", reason: "server_error" }));
    return;
  }

  if (!userId) {
    console.warn("[instagram] Rejected callback with invalid or reused state");
    res.redirect(frontendRedirect({ instagram: "error", reason: "invalid_state" }));
    return;
  }

  // Named so a failure says which of the three Instagram calls died; they fail
  // in very different ways and the error text alone does not distinguish them.
  let step = "code exchange";
  try {
    const shortLived = await exchangeCodeForToken(code);

    // The 60-day upgrade is an optimisation, not a requirement. Instagram
    // Business Login can hand back a token that ig_exchange_token refuses with
    // "Unsupported request - method type: get" (code 100) — it rejects the
    // route, not the credentials, so there is nothing to retry or reconfigure.
    // Dropping a working connection over an optional upgrade is the wrong
    // trade: keep the token we already hold and let the profile read below be
    // the thing that decides whether it is actually usable.
    step = "long-lived token exchange";
    let token = shortLived.accessToken;
    let expiresAt: Date | null = null;
    try {
      const longLived = await exchangeForLongLivedToken(shortLived.accessToken);
      token = longLived.token;
      expiresAt = longLived.expiresAt;
    } catch (err: any) {
      console.warn(
        `[instagram] Long-lived upgrade skipped: ${err?.message || "unknown error"} — ` +
          "continuing with the token from the code exchange.",
      );
    }

    step = "profile read";
    const profile = await getInstagramProfile(token, shortLived.instagramId);

    const instagramId = profile.instagramId || shortLived.instagramId;

    const [existing] = await db
      .select({ id: instagramAccountsTable.id })
      .from(instagramAccountsTable)
      .where(
        and(
          eq(instagramAccountsTable.userId, userId),
          eq(instagramAccountsTable.instagramId, instagramId),
        ),
      )
      .limit(1);

    const values = {
      userId,
      instagramId,
      username: profile.username,
      profilePictureUrl: profile.profilePictureUrl,
      accountType: profile.accountType,
      permissions: shortLived.permissions,
      accessToken: encrypt(token),
      tokenExpiresAt: expiresAt,
      updatedAt: new Date(),
    };

    if (existing) {
      await db
        .update(instagramAccountsTable)
        .set(values)
        .where(eq(instagramAccountsTable.id, existing.id));
    } else {
      await db.insert(instagramAccountsTable).values(values);
    }

    await logAction(userId, "instagram_connected", undefined, { username: profile.username });
    console.log(`[instagram] Account connected: @${profile.username}`);

    res.redirect(frontendRedirect({ instagram: "connected", username: profile.username }));
  } catch (err: any) {
    // Never leak tokens, codes or secrets — but Instagram's own error text is
    // the only thing that distinguishes "not a Professional account" from
    // "this account has no role on the app while the permission is still on
    // Standard Access", so it must reach both the log and the creator.
    const apiErr = err instanceof InstagramApiError ? err : null;
    const message = apiErr?.message ?? "connection_failed";
    const detail = apiErr?.detail && apiErr.detail !== message ? apiErr.detail : null;
    console.error(
      `[instagram] OAuth callback failed during ${step}: ${message}` +
        (detail ? ` | Instagram said: ${detail}` : "") +
        (apiErr?.endpoint ? ` | ${apiErr.endpoint}` : "") +
        (apiErr?.code != null ? ` | code=${apiErr.code}` : "") +
        (apiErr?.subcode != null ? ` subcode=${apiErr.subcode}` : ""),
    );
    res.redirect(
      frontendRedirect({
        instagram: "error",
        reason: "exchange_failed",
        message: `[${step}] ${detail ?? message}`.slice(0, 200),
      }),
    );
  }
});

/** GET /api/integrations/instagram/accounts */
router.get("/accounts", requireAuth, requireRole("creator"), async (req, res) => {
  const rows = await db
    .select()
    .from(instagramAccountsTable)
    .where(eq(instagramAccountsTable.userId, req.user!.userId))
    .orderBy(desc(instagramAccountsTable.createdAt));

  res.json({
    configured: isInstagramConfigured(),
    connected: rows.length > 0,
    accounts: rows.map(publicAccount),
  });
});

/** Removes a connection after proving it belongs to the caller. */
async function disconnectAccount(userId: string, accountId: string): Promise<boolean> {
  const [account] = await db
    .select()
    .from(instagramAccountsTable)
    .where(
      and(eq(instagramAccountsTable.id, accountId), eq(instagramAccountsTable.userId, userId)),
    )
    .limit(1);

  if (!account) return false;

  await db.delete(instagramAccountsTable).where(eq(instagramAccountsTable.id, account.id));
  await logAction(userId, "instagram_disconnected", undefined, { username: account.username });
  console.log(`[instagram] Account disconnected: @${account.username}`);
  return true;
}

/** DELETE /api/integrations/instagram/accounts/:id */
router.delete("/accounts/:id", requireAuth, requireRole("creator"), async (req, res) => {
  const ok = await disconnectAccount(req.user!.userId, (req.params as { id: string }).id);
  if (!ok) {
    res.status(404).json({ error: "Instagram account not found" });
    return;
  }
  res.json({ success: true });
});

/** POST .../accounts/:id/disconnect — same operation, kept for the existing UI. */
router.post(
  "/accounts/:id/disconnect",
  requireAuth,
  requireRole("creator"),
  async (req, res) => {
    const ok = await disconnectAccount(req.user!.userId, (req.params as { id: string }).id);
    if (!ok) {
      res.status(404).json({ error: "Instagram account not found" });
      return;
    }
    res.json({ success: true });
  },
);

// ── Publishing ───────────────────────────────────────────────────────────────

/** Signed Cloudinary URL Instagram can fetch server-side. */
function resolveMediaUrl(video: typeof videosTable.$inferSelect): string | null {
  const resourceType = video.mediaType === "image" ? "image" : "video";
  if (video.storedFilename) return getSignedUrl(video.storedFilename, resourceType);
  if (video.videoUrl?.includes("cloudinary.com")) {
    const match = video.videoUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
    if (match?.[1]) return getSignedUrlFromPublicId(match[1], resourceType);
  }
  if (video.videoUrl?.startsWith("https://")) return video.videoUrl;
  return null;
}

interface PublishRequest {
  userId: string;
  instagramAccountId: string;
  postType: PostType;
  caption: string;
  coverUrl?: string | null;
  /** Either a MediaLayer video… */
  videoId?: string | null;
  /** …or a public HTTPS media URL. */
  mediaUrl?: string | null;
}

type PublishOutcome =
  | { ok: true; postId: string }
  | { ok: false; status: number; error: string };

/**
 * Validates ownership and inputs, records a PENDING row, and kicks off the
 * container → poll → publish sequence in the background.
 */
async function startPublish(input: PublishRequest): Promise<PublishOutcome> {
  if (!isInstagramConfigured()) {
    return { ok: false, status: 503, error: "Instagram publishing is not configured on this server." };
  }
  if (!input.instagramAccountId) {
    return { ok: false, status: 400, error: "instagramAccountId is required" };
  }
  if (input.postType !== "REELS" && input.postType !== "FEED") {
    return { ok: false, status: 400, error: "postType must be REELS or FEED" };
  }
  if (input.caption.length > MAX_CAPTION_LENGTH) {
    return {
      ok: false,
      status: 400,
      error: `Caption must be ${MAX_CAPTION_LENGTH} characters or fewer`,
    };
  }

  // The account must belong to the caller — never trust the id alone.
  const [account] = await db
    .select()
    .from(instagramAccountsTable)
    .where(
      and(
        eq(instagramAccountsTable.id, input.instagramAccountId),
        eq(instagramAccountsTable.userId, input.userId),
      ),
    )
    .limit(1);

  if (!account) return { ok: false, status: 404, error: "Instagram account not connected" };

  let mediaUrl: string | null = null;
  let video: typeof videosTable.$inferSelect | null = null;

  if (input.videoId) {
    const [row] = await db
      .select()
      .from(videosTable)
      .where(eq(videosTable.id, input.videoId))
      .limit(1);
    if (!row) return { ok: false, status: 404, error: "Video not found" };
    if (row.creatorId !== input.userId) return { ok: false, status: 403, error: "Forbidden" };
    if (row.status !== "approved" && row.status !== "uploaded") {
      return {
        ok: false,
        status: 400,
        error: "Video must be approved before publishing to Instagram",
      };
    }
    video = row;
    mediaUrl = resolveMediaUrl(row);
    if (!mediaUrl) {
      return {
        ok: false,
        status: 400,
        error: `No ${row.mediaType === "image" ? "photo" : "video"} file available to publish. Ask the editor to re-upload.`,
      };
    }
  } else if (input.mediaUrl) {
    if (!/^https:\/\//i.test(input.mediaUrl)) {
      return { ok: false, status: 400, error: "mediaUrl must be a public HTTPS URL" };
    }
    mediaUrl = input.mediaUrl;
  } else {
    return { ok: false, status: 400, error: "Either videoId or mediaUrl is required" };
  }

  // Don't queue a second attempt while one is still running.
  if (input.videoId) {
    const [inFlight] = await db
      .select({ id: instagramPostsTable.id })
      .from(instagramPostsTable)
      .where(
        and(
          eq(instagramPostsTable.videoId, input.videoId),
          eq(instagramPostsTable.instagramAccountId, account.id),
          eq(instagramPostsTable.status, "PENDING"),
        ),
      )
      .limit(1);
    if (inFlight) {
      return { ok: false, status: 409, error: "This video is already being published to Instagram." };
    }
  }

  // A photo submission is authoritative; otherwise fall back to the file extension.
  const isImage = video ? video.mediaType === "image" : /\.(jpe?g|png)(\?|$)/i.test(mediaUrl);
  // Instagram has no such thing as an image Reel — photos always go to the feed.
  const postType: PostType = isImage ? "FEED" : input.postType;

  const [post] = await db
    .insert(instagramPostsTable)
    .values({
      videoId: input.videoId ?? null,
      instagramAccountId: account.id,
      publishedById: input.userId,
      postType,
      caption: input.caption,
      coverUrl: input.coverUrl || null,
      status: "PENDING",
    })
    .returning();

  await logAction(input.userId, "instagram_publish_started", input.videoId ?? undefined, {
    postType,
    username: account.username,
  });
  console.log(`[instagram] Publish started for @${account.username}`);

  const accessToken = decrypt(account.accessToken);

  void (async () => {
    try {
      const containerId = await createMediaContainer({
        instagramUserId: account.instagramId,
        accessToken,
        mediaUrl: mediaUrl!,
        caption: input.caption,
        coverUrl: input.coverUrl || null,
        postType,
        isImage,
      });

      await waitForContainer(containerId, accessToken);

      const instagramPostId = await publishContainer({
        instagramUserId: account.instagramId,
        containerId,
        accessToken,
      });

      const permalink =
        (await getMediaPermalink(instagramPostId, accessToken)) ??
        `https://www.instagram.com/${account.username}/`;

      await db
        .update(instagramPostsTable)
        .set({
          status: "PUBLISHED",
          instagramPostId,
          permalink,
          publishedAt: new Date(),
          errorMessage: null,
          updatedAt: new Date(),
        })
        .where(eq(instagramPostsTable.id, post.id));

      await logAction(input.userId, "published_to_instagram", input.videoId ?? undefined, {
        postType,
        username: account.username,
        permalink,
        instagramPostId,
      });

      if (video) {
        await db.insert(notificationsTable).values({
          userId: video.editorId,
          title:
            postType === "REELS" ? "Published as an Instagram Reel" : "Published to Instagram",
          message: `"${video.title}" is live on @${account.username}: ${permalink}`,
          type: "video_published_instagram",
          videoId: video.id,
        });
      }

      console.log(`[instagram] Publish completed for @${account.username}`);
    } catch (err: any) {
      const message =
        err instanceof InstagramApiError ? err.message : err?.message || "Instagram publishing failed.";

      await db
        .update(instagramPostsTable)
        .set({ status: "FAILED", errorMessage: message, updatedAt: new Date() })
        .where(eq(instagramPostsTable.id, post.id))
        .catch(() => {});

      await logAction(input.userId, "instagram_publish_failed", input.videoId ?? undefined, {
        postType,
        username: account.username,
        error: message,
      });
      console.error(`[instagram] Publish failed for @${account.username}: ${message}`);

      if (err instanceof InstagramApiError && err.needsReconnect) {
        await db
          .update(instagramAccountsTable)
          .set({ tokenExpiresAt: new Date(), updatedAt: new Date() })
          .where(eq(instagramAccountsTable.id, account.id))
          .catch(() => {});
      }
    }
  })();

  return { ok: true, postId: post.id };
}

/**
 * POST /api/integrations/instagram/publish
 * Body: { instagramAccountId, postType, caption, mediaUrl? | videoId?, coverUrl? }
 */
router.post("/publish", requireAuth, requireRole("creator"), async (req, res) => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const result = await startPublish({
    userId: req.user!.userId,
    instagramAccountId: String(body.instagramAccountId ?? ""),
    postType: (body.postType as PostType) ?? "REELS",
    caption: String(body.caption ?? ""),
    coverUrl: (body.coverUrl as string) ?? null,
    videoId: (body.videoId as string) ?? null,
    mediaUrl: (body.mediaUrl as string) ?? null,
  });

  if (!result.ok) {
    res.status(result.status).json({ error: result.error });
    return;
  }
  res.status(202).json({ success: true, post: { id: result.postId, status: "PENDING" } });
});

export default router;

// ── Video-scoped endpoints (mounted under /api/videos) ───────────────────────

export const instagramPublishRouter: IRouter = Router();

/**
 * GET /api/videos/:id/instagram-posts
 * Readable by both roles — editors can see publish state but never publish.
 */
instagramPublishRouter.get("/:id/instagram-posts", requireAuth, async (req, res) => {
  const { id } = req.params as { id: string };
  const [video] = await db.select().from(videosTable).where(eq(videosTable.id, id)).limit(1);

  if (!video) {
    res.status(404).json({ error: "Video not found" });
    return;
  }
  if (video.creatorId !== req.user!.userId && video.editorId !== req.user!.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const posts = await db
    .select({
      id: instagramPostsTable.id,
      videoId: instagramPostsTable.videoId,
      postType: instagramPostsTable.postType,
      status: instagramPostsTable.status,
      instagramPostId: instagramPostsTable.instagramPostId,
      permalink: instagramPostsTable.permalink,
      caption: instagramPostsTable.caption,
      coverUrl: instagramPostsTable.coverUrl,
      errorMessage: instagramPostsTable.errorMessage,
      publishedAt: instagramPostsTable.publishedAt,
      createdAt: instagramPostsTable.createdAt,
      account: {
        id: instagramAccountsTable.id,
        username: instagramAccountsTable.username,
        profilePictureUrl: instagramAccountsTable.profilePictureUrl,
      },
    })
    .from(instagramPostsTable)
    .innerJoin(
      instagramAccountsTable,
      eq(instagramPostsTable.instagramAccountId, instagramAccountsTable.id),
    )
    .where(eq(instagramPostsTable.videoId, id))
    .orderBy(desc(instagramPostsTable.createdAt));

  res.json({ posts });
});

/** POST /api/videos/:id/publish/instagram — same core, video-scoped. */
instagramPublishRouter.post(
  "/:id/publish/instagram",
  requireAuth,
  requireRole("creator"),
  async (req, res) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const result = await startPublish({
      userId: req.user!.userId,
      instagramAccountId: String(body.instagramAccountId ?? ""),
      postType: (body.postType as PostType) ?? "REELS",
      caption: String(body.caption ?? ""),
      coverUrl: (body.coverUrl as string) ?? null,
      videoId: (req.params as { id: string }).id,
    });

    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.status(202).json({ success: true, post: { id: result.postId, status: "PENDING" } });
  },
);
