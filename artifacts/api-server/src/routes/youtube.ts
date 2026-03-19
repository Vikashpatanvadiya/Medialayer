import { Router } from "express";
import { db, usersTable, videosTable, notificationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth.js";
import { getAuthUrl, createOAuth2Client, uploadVideoToYouTube } from "../lib/youtube.js";
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
          access_token: tokens.access_token!,
          refresh_token: tokens.refresh_token!,
          expiry_date: tokens.expiry_date as number,
        },
        youtubeChannelName: channelName,
      })
      .where(eq(usersTable.id, userId));

    res.send(`
      <html>
        <body>
          <script>
            window.opener && window.opener.postMessage({ type: 'YOUTUBE_CONNECTED', channelName: '${channelName}' }, '*');
            window.close();
          </script>
          <p>YouTube connected! You can close this window.</p>
        </body>
      </html>
    `);
  } catch (err) {
    console.error("YouTube OAuth error:", err);
    res.status(500).send("OAuth failed. Please try again.");
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

router.post("/upload/:videoId", requireAuth, requireRole("creator"), async (req, res) => {
  const { videoId } = req.params;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.userId))
    .limit(1);

  if (!user?.youtubeTokens) {
    res.status(400).json({ error: "YouTube account not connected. Please connect first." });
    return;
  }

  const [video] = await db
    .select()
    .from(videosTable)
    .where(eq(videosTable.id, videoId))
    .limit(1);

  if (!video) {
    res.status(404).json({ error: "Video not found" });
    return;
  }

  if (video.creatorId !== req.user!.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  if (video.status !== "approved") {
    res.status(400).json({ error: "Video must be approved before uploading to YouTube" });
    return;
  }

  const uploadDir = path.join(process.cwd(), "uploads");
  const filePath = path.join(uploadDir, video.videoUrl);

  if (!fs.existsSync(filePath)) {
    res.status(400).json({ error: "Video file not found on server. It may have been deleted." });
    return;
  }

  try {
    const result = await uploadVideoToYouTube(
      user.youtubeTokens,
      filePath,
      video.title,
      video.description,
      (video.tags as string[]) || [],
    );

    await db
      .update(videosTable)
      .set({ status: "uploaded", updatedAt: new Date() })
      .where(eq(videosTable.id, videoId));

    await db.insert(notificationsTable).values({
      userId: video.editorId,
      title: "Video uploaded to YouTube!",
      message: `"${video.title}" has been uploaded to YouTube: ${result.youtubeUrl}`,
      type: "video_uploaded",
      videoId: video.id,
    });

    fs.unlink(filePath, () => {});

    res.json({
      success: true,
      youtubeVideoId: result.youtubeVideoId,
      youtubeUrl: result.youtubeUrl,
    });
  } catch (err: any) {
    console.error("YouTube upload error:", err);
    res.status(500).json({ error: `YouTube upload failed: ${err.message}` });
  }
});

export default router;
