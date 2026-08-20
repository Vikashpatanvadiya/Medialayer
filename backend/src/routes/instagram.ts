import { Router, type IRouter } from "express";
import jwt from "jsonwebtoken";
import { and, desc, eq } from "drizzle-orm";
import {
  db,
  instagramAccountsTable,
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
  discoverInstagramAccounts,
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  getInstagramAuthUrl,
  getMediaPermalink,
  isInstagramConfigured,
  publishContainer,
  revokeInstagramAccess,
  waitForContainer,
  type PostType,
} from "../lib/instagram.js";

const router: IRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET!;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const MAX_CAPTION_LENGTH = 2200;

/** Signed, short-lived OAuth state — proves the callback belongs to this user. */
function createState(userId: string): string {
  return jwt.sign({ userId, purpose: "instagram_oauth" }, JWT_SECRET, { expiresIn: "10m" });
}

function readState(state: string): string | null {
  try {
    const payload = jwt.verify(state, JWT_SECRET) as { userId?: string; purpose?: string };
    if (payload.purpose !== "instagram_oauth" || !payload.userId) return null;
    return payload.userId;
  } catch {
    return null;
  }
}

/** Small page that hands the result back to the opener window and closes. */
function popupResponse(ok: boolean, detail: string): string {
  const payload = JSON.stringify({ type: "INSTAGRAM_CONNECTED", ok, detail });
  return `<!doctype html><html><body style="font-family:system-ui;padding:32px">
  <p>${ok ? "Instagram connected." : "Instagram connection failed."} You can close this window.</p>
  <p style="color:#666;font-size:13px">${detail.replace(/</g, "&lt;")}</p>
  <script>
    try { window.opener && window.opener.postMessage(${payload}, ${JSON.stringify(FRONTEND_URL)}); } catch (e) {}
    setTimeout(function () { window.close(); }, ${ok ? 600 : 4000});
  </script>
</body></html>`;
}

function publicAccount(row: typeof instagramAccountsTable.$inferSelect) {
  // Never expose the access token to the client.
  return {
    id: row.id,
    instagramId: row.instagramId,
    username: row.username,
    profilePictureUrl: row.profilePictureUrl,
    fbPageId: row.fbPageId,
    fbPageName: row.fbPageName,
    tokenExpiresAt: row.tokenExpiresAt,
    createdAt: row.createdAt,
  };
}

// ── Connection ───────────────────────────────────────────────────────────────

/**
 * GET /api/integrations/instagram/connect
 * Returns the Facebook OAuth URL (default, for the popup flow), or 302-redirects
 * to it when called with ?redirect=1.
 */
router.get("/connect", requireAuth, requireRole("creator"), (req, res) => {
  if (!isInstagramConfigured()) {
    res.status(503).json({
      error: "Instagram publishing is not configured on this server (META_APP_ID / META_APP_SECRET).",
    });
    return;
  }

  const url = getInstagramAuthUrl(createState(req.user!.userId));
  if (req.query.redirect === "1") {
    res.redirect(url);
    return;
  }
  res.json({ url });
});

/**
 * GET /api/integrations/instagram/callback
 * Meta redirects the creator here after they approve the permissions.
 */
router.get("/callback", async (req, res) => {
  const { code, state, error_description: errorDescription, error: oauthError } =
    req.query as Record<string, string | undefined>;

  if (oauthError) {
    res.status(400).send(popupResponse(false, errorDescription || oauthError));
    return;
  }
  if (!code || !state) {
    res.status(400).send(popupResponse(false, "Missing authorization code."));
    return;
  }

  const userId = readState(state);
  if (!userId) {
    res.status(400).send(popupResponse(false, "This connection link expired. Please try again."));
    return;
  }

  try {
    const shortLived = await exchangeCodeForToken(code);
    const { token: longLived, expiresAt } = await exchangeForLongLivedToken(shortLived);
    const { accounts, pageNames } = await discoverInstagramAccounts(longLived);

    if (accounts.length === 0) {
      const detail =
        pageNames.length === 0
          ? "Facebook granted login but returned no Pages to the API. Reconnect, click Edit settings, select your Page (B1clicks), and allow business/page access."
          : `Found Facebook Page(s) (${pageNames.join(", ")}) but no linked Instagram Business account on those Pages. In Instagram, confirm @b1_clicks is Business/Creator and linked to that Page.`;
      res.status(400).send(popupResponse(false, detail));
      return;
    }

    for (const account of accounts) {
      const [existing] = await db
        .select({ id: instagramAccountsTable.id })
        .from(instagramAccountsTable)
        .where(
          and(
            eq(instagramAccountsTable.userId, userId),
            eq(instagramAccountsTable.instagramId, account.instagramId),
          ),
        )
        .limit(1);

      const values = {
        userId,
        instagramId: account.instagramId,
        username: account.username,
        profilePictureUrl: account.profilePictureUrl,
        fbPageId: account.fbPageId,
        fbPageName: account.fbPageName,
        accessToken: encrypt(account.pageAccessToken),
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
    }

    await logAction(userId, "instagram_connected", undefined, {
      accounts: accounts.map((a) => a.username),
    });

    res.send(popupResponse(true, `Connected @${accounts.map((a) => a.username).join(", @")}`));
  } catch (err: any) {
    console.error("[instagram] OAuth callback failed:", err?.message || err);
    res
      .status(500)
      .send(popupResponse(false, err instanceof InstagramApiError ? err.message : "Connection failed."));
  }
});

/** GET /api/integrations/instagram/accounts — connected accounts for this creator. */
router.get("/accounts", requireAuth, requireRole("creator"), async (req, res) => {
  const rows = await db
    .select()
    .from(instagramAccountsTable)
    .where(eq(instagramAccountsTable.userId, req.user!.userId))
    .orderBy(desc(instagramAccountsTable.createdAt));

  res.json({ configured: isInstagramConfigured(), accounts: rows.map(publicAccount) });
});

/** POST /api/integrations/instagram/accounts/:id/disconnect */
router.post(
  "/accounts/:id/disconnect",
  requireAuth,
  requireRole("creator"),
  async (req, res) => {
    const { id } = req.params as { id: string };
    const [account] = await db
      .select()
      .from(instagramAccountsTable)
      .where(
        and(eq(instagramAccountsTable.id, id), eq(instagramAccountsTable.userId, req.user!.userId)),
      )
      .limit(1);

    if (!account) {
      res.status(404).json({ error: "Instagram account not found" });
      return;
    }

    // Best effort — the local record is removed either way.
    try {
      await revokeInstagramAccess(account.instagramId, decrypt(account.accessToken));
    } catch (err: any) {
      console.warn("[instagram] Token revoke failed:", err?.message || err);
    }

    await db.delete(instagramAccountsTable).where(eq(instagramAccountsTable.id, account.id));
    await logAction(req.user!.userId, "instagram_disconnected", undefined, {
      username: account.username,
    });

    res.json({ success: true });
  },
);

export default router;

// ── Publishing (mounted under /api/videos) ───────────────────────────────────

export const instagramPublishRouter: IRouter = Router();

/** Signed Cloudinary URL Instagram can fetch server-side (needs a long TTL). */
function resolveVideoUrl(video: typeof videosTable.$inferSelect): string | null {
  if (video.storedFilename) return getSignedUrl(video.storedFilename);
  if (video.videoUrl?.includes("cloudinary.com")) {
    const match = video.videoUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
    if (match?.[1]) return getSignedUrlFromPublicId(match[1]);
  }
  if (video.videoUrl?.startsWith("http")) return video.videoUrl;
  return null;
}

async function postsForVideo(videoId: string) {
  const rows = await db
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
    .where(eq(instagramPostsTable.videoId, videoId))
    .orderBy(desc(instagramPostsTable.createdAt));
  return rows;
}

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

  res.json({ posts: await postsForVideo(id) });
});

/**
 * POST /api/videos/:id/publish/instagram
 * Creators only. Returns immediately; the container upload runs in the
 * background and the post row moves PENDING → PUBLISHED | FAILED.
 */
instagramPublishRouter.post(
  "/:id/publish/instagram",
  requireAuth,
  requireRole("creator"),
  async (req, res) => {
    const { id: videoId } = req.params as { id: string };
    const {
      instagramAccountId,
      postType,
      caption = "",
      coverUrl,
    } = (req.body ?? {}) as {
      instagramAccountId?: string;
      postType?: PostType;
      caption?: string;
      coverUrl?: string;
    };

    if (!isInstagramConfigured()) {
      res.status(503).json({ error: "Instagram publishing is not configured on this server." });
      return;
    }
    if (!instagramAccountId) {
      res.status(400).json({ error: "instagramAccountId is required" });
      return;
    }
    if (postType !== "REELS" && postType !== "FEED") {
      res.status(400).json({ error: "postType must be REELS or FEED" });
      return;
    }
    if (caption.length > MAX_CAPTION_LENGTH) {
      res.status(400).json({ error: `Caption must be ${MAX_CAPTION_LENGTH} characters or fewer` });
      return;
    }

    const [video] = await db.select().from(videosTable).where(eq(videosTable.id, videoId)).limit(1);
    if (!video) {
      res.status(404).json({ error: "Video not found" });
      return;
    }
    if (video.creatorId !== req.user!.userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    if (video.status !== "approved" && video.status !== "uploaded") {
      res.status(400).json({ error: "Video must be approved before publishing to Instagram" });
      return;
    }

    const [account] = await db
      .select()
      .from(instagramAccountsTable)
      .where(
        and(
          eq(instagramAccountsTable.id, instagramAccountId),
          eq(instagramAccountsTable.userId, req.user!.userId),
        ),
      )
      .limit(1);

    if (!account) {
      res.status(404).json({ error: "Instagram account not connected" });
      return;
    }

    const videoUrl = resolveVideoUrl(video);
    if (!videoUrl) {
      res.status(400).json({ error: "No video file available to publish. Ask the editor to re-upload." });
      return;
    }

    // Don't queue a second attempt while one is still running.
    const [inFlight] = await db
      .select({ id: instagramPostsTable.id })
      .from(instagramPostsTable)
      .where(
        and(
          eq(instagramPostsTable.videoId, videoId),
          eq(instagramPostsTable.instagramAccountId, account.id),
          eq(instagramPostsTable.status, "PENDING"),
        ),
      )
      .limit(1);

    if (inFlight) {
      res.status(409).json({ error: "This video is already being published to Instagram." });
      return;
    }

    const [post] = await db
      .insert(instagramPostsTable)
      .values({
        videoId,
        instagramAccountId: account.id,
        publishedById: req.user!.userId,
        postType,
        caption,
        coverUrl: coverUrl || null,
        status: "PENDING",
      })
      .returning();

    await logAction(req.user!.userId, "instagram_publish_started", videoId, {
      postType,
      username: account.username,
    });

    res.status(202).json({ success: true, post: { id: post.id, status: post.status, postType } });

    // ── Background publish ──
    const accessToken = decrypt(account.accessToken);

    (async () => {
      const fail = async (message: string) => {
        await db
          .update(instagramPostsTable)
          .set({ status: "FAILED", errorMessage: message, updatedAt: new Date() })
          .where(eq(instagramPostsTable.id, post.id))
          .catch(() => {});
        await logAction(video.creatorId, "instagram_publish_failed", videoId, {
          postType,
          username: account.username,
          error: message,
        });
        console.error(`[instagram] Publish failed for video ${videoId}: ${message}`);
      };

      try {
        const containerId = await createMediaContainer({
          instagramUserId: account.instagramId,
          accessToken,
          videoUrl,
          caption,
          coverUrl: coverUrl || null,
          postType,
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

        await logAction(video.creatorId, "published_to_instagram", videoId, {
          postType,
          username: account.username,
          permalink,
          instagramPostId,
        });

        await db.insert(notificationsTable).values({
          userId: video.editorId,
          title: postType === "REELS" ? "Published as an Instagram Reel" : "Published to Instagram",
          message: `"${video.title}" is live on @${account.username}: ${permalink}`,
          type: "video_published_instagram",
          videoId: video.id,
        });

        console.log(`[instagram] Published video ${videoId} → ${permalink}`);
      } catch (err: any) {
        const message =
          err instanceof InstagramApiError
            ? err.message
            : err?.message || "Instagram publishing failed.";
        await fail(message);

        // An expired token can't be recovered from — surface it on the account.
        if (err instanceof InstagramApiError && err.needsReconnect) {
          await db
            .update(instagramAccountsTable)
            .set({ tokenExpiresAt: new Date(), updatedAt: new Date() })
            .where(eq(instagramAccountsTable.id, account.id))
            .catch(() => {});
        }
      }
    })();
  },
);

