import { Router } from "express";
import { requireAuth } from "../lib/auth.js";
import { db, videosTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getSignedUrl } from "../lib/cloudinary.js";
import https from "https";

const router = Router();

// Allow token via query param for video streaming (browser video tag can't set headers)
router.use((req, _res, next) => {
  if (req.query.token && !req.headers.authorization) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  next();
});

const router = Router();

// Proxy video stream through backend so Cloudinary URL is never exposed
router.get("/:videoId", requireAuth, async (req, res) => {
  const { videoId } = req.params;
  const user = req.user!;

  const [video] = await db.select().from(videosTable).where(eq(videosTable.id, videoId)).limit(1);

  if (!video) { res.status(404).json({ error: "Video not found" }); return; }

  // Only creator or editor of this video can stream it
  if (video.creatorId !== user.userId && video.editorId !== user.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  if (!video.storedFilename) {
    res.status(404).json({ error: "No video file" });
    return;
  }

  const signedUrl = getSignedUrl(video.storedFilename);

  // Proxy the stream
  https.get(signedUrl, (stream) => {
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Cache-Control", "no-store");
    if (stream.headers["content-length"]) {
      res.setHeader("Content-Length", stream.headers["content-length"]);
    }
    stream.pipe(res);
  }).on("error", (err) => {
    res.status(500).json({ error: `Stream failed: ${err.message}` });
  });
});

export default router;
