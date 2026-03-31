import { Router } from "express";
import { db, usersTable, videosTable, notificationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth.js";
import { getAuthUrl, createOAuth2Client, uploadVideoToYouTube } from "../lib/youtube.js";
import { sendEmail, emailTemplates } from "../lib/mailer.js";
import { downloadFromCloudinary } from "../lib/cloudinary.js";
import { encrypt, decrypt } from "../lib/crypto.js";
import path from "path";
import fs from "fs";

const router = Router();

router.get("/auth-url", requireAuth, requireRole("creator"), (req, res) => {
  const url = getAuthUrl(req.user!.userId);
  res.json({ url });
});

router.get("/oauth-callback", async (req, res) => {
  const { code, state: userId } = req.query as { code: string; state: string };

  if (!code || !userId) {
    res.status(400).send("Missing code or state");
    return;
  }

  try {
    const client = createOAuth2Client();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const { google } = await import("googleapis");
    const youtube = google.youtube({ version: "v3", auth: client });
    const channelRes = await youtube.channels.list({ part: ["snippet"], mine: true });
    const channelName = channelRes.data.items?.[0]?.snippet?.title || "YouTube Channel";

    await db
      .update(usersTable)
      .set({
        youtubeTokens: {
          access_token: encrypt(tokens.access_token!),
          // Google only returns refresh_token on first auth — keep existing if not returned
          refresh_token: tokens.refresh_token ? encrypt(tokens.refresh_token) : "__missing__",
          expiry_date: tokens.expiry_date as number,
        },
        youtubeChannelName: channelName,
      })
      .where(eq(usersTable.id, userId));

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.send(`
      <html>
        <body>
          <script>
            window.opener && window.opener.postMessage({ type: 'YOUTUBE_CONNECTED', channelName: '${channelName}' }, '${frontendUrl}');
            window.close();
          </script>
          <p>YouTube connected! You can close this window.</p>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error("YouTube OAuth error:", JSON.stringify(err?.response?.data || err?.message || err, null, 2));
    res.status(500).send(`OAuth failed: ${err?.message || JSON.stringify(err?.response?.data)}`);
  }
});

router.get("/status", requireAuth, requireRole("creator"), async (req, res) => {
  const [user] = await db
    .select({ youtubeTokens: usersTable.youtubeTokens, youtubeChannelName: usersTable.youtubeChannelName })
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.userId))
    .limit(1);

  res.json({
    connected: !!(user?.youtubeTokens),
    channelName: user?.youtubeChannelName || null,
  });
});

router.post("/disconnect", requireAuth, requireRole("creator"), async (req, res) => {
  await db.update(usersTable)
    .set({ youtubeTokens: null, youtubeChannelName: null })
    .where(eq(usersTable.id, req.user!.userId));
  res.json({ success: true });
});

router.post("/upload/:videoId", requireAuth, requireRole("creator"), async (req, res) => {
  const { videoId } = req.params as { videoId: string };

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
  if (!user?.youtubeTokens) {
    res.status(400).json({ error: "YouTube account not connected. Please connect first." });
    return;
  }

  const [video] = await db.select().from(videosTable).where(eq(videosTable.id, videoId)).limit(1);
  if (!video) { res.status(404).json({ error: "Video not found" }); return; }
  if (video.creatorId !== req.user!.userId) { res.status(403).json({ error: "Forbidden" }); return; }
  if (video.status !== "approved" && video.status !== "uploaded") {
    res.status(400).json({ error: "Video must be approved before uploading to YouTube" });
    return;
  }
  if (!video.storedFilename) {
    res.status(400).json({ error: "No file stored for this video. The editor must re-upload the file." });
    return;
  }

  // Respond immediately — upload runs in background
  // Reset youtubeUrl so polling knows it's in progress
  await db.update(videosTable)
    .set({ youtubeUrl: null, updatedAt: new Date() })
    .where(eq(videosTable.id, videoId));

  res.json({ success: true, status: "uploading", message: "YouTube upload started. Check back in a moment." });

  // Capture values needed in background (don't close over mutable request state)
  const videoId_ = videoId;
  const storedFilename_ = video.storedFilename!;
  const videoUrl_ = video.videoUrl;
  const privacyStatus = (req.body?.privacyStatus as "public" | "unlisted" | "private") || "public";
  const rawTokens = user.youtubeTokens!;
  // Decrypt tokens for use — they are stored encrypted in DB
  const userTokens = {
    access_token: decrypt(rawTokens.access_token),
    refresh_token: decrypt(rawTokens.refresh_token),
    expiry_date: rawTokens.expiry_date,
  };

  // Background upload (don't await)
  (async () => {
    const uploadDir = path.join(process.cwd(), "uploads");
    const filePath = path.join(uploadDir, storedFilename_);

    try {
      // Download from Cloudinary using storedFilename (most reliable)
      if (!fs.existsSync(filePath)) {
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        console.log(`[yt-upload] Downloading from Cloudinary: ${storedFilename_}`);
        await downloadFromCloudinary(storedFilename_, filePath);
        console.log(`[yt-upload] Download complete, starting YouTube upload`);
      }

      const result = await uploadVideoToYouTube(
        userTokens,
        filePath,
        video.title,
        video.description,
        (video.tags as string[]) || [],
        video.thumbnailUrl || null,
        privacyStatus,
      );

      await db.update(videosTable)
        .set({ status: "uploaded", youtubeVideoId: result.youtubeVideoId, youtubeUrl: result.youtubeUrl, updatedAt: new Date() })
        .where(eq(videosTable.id, videoId_));

      // Save refreshed tokens back to DB if they were updated
      if (result.refreshedTokens) {
        const { encrypt } = await import("../lib/crypto.js");
        await db.update(usersTable).set({
          youtubeTokens: {
            access_token: encrypt(result.refreshedTokens.access_token),
            refresh_token: encrypt(result.refreshedTokens.refresh_token),
            expiry_date: result.refreshedTokens.expiry_date,
          }
        }).where(eq(usersTable.id, video.creatorId));
        console.log("[yt-upload] Refreshed tokens saved to DB");
      }

      await db.insert(notificationsTable).values({
        userId: video.editorId,
        title: "Video uploaded to YouTube!",
        message: `"${video.title}" has been uploaded to YouTube: ${result.youtubeUrl}`,
        type: "video_uploaded",
        videoId: video.id,
      });

      const [editor] = await db.select().from(usersTable).where(eq(usersTable.id, video.editorId)).limit(1);
      if (editor?.email) {
        const tpl = emailTemplates.videoUploaded(video.title, result.youtubeUrl);
        await sendEmail(editor.email, tpl.subject, tpl.html);
      }

      fs.unlink(filePath, () => {});
      console.log("YT upload complete:", result.youtubeUrl);
    } catch (err: any) {
      console.error("YT upload failed:", err?.message || err);
      await db.update(videosTable)
        .set({ youtubeUrl: `error:${err?.message || "upload failed"}`, updatedAt: new Date() })
        .where(eq(videosTable.id, videoId_))
        .catch(() => {});
    }
  })();
});

export default router;
