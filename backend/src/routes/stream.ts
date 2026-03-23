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

router.get("/:videoId", requireAuth, async (req, res) => {
  const { videoId } = req.params;
  const user = req.user!;

  const [video] = await db.select().from(videosTable).where(eq(videosTable.id, videoId)).limit(1);

  if (!video) { res.status(404).json({ error: "Video not found" }); return; }

  if (video.creatorId !== user.userId && video.editorId !== user.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  if (!video.storedFilename) {
    res.status(404).json({ error: "No video file" });
    return;
  }

  const signedUrl = getSignedUrl(video.storedFilename);

  const headers: Record<string, string> = {};
  if (req.headers.range) headers["Range"] = req.headers.range;

  const cloudinaryReq = https.get(signedUrl, { headers }, (stream) => {
    const status = stream.statusCode || 200;
    const responseHeaders: Record<string, string> = {
      "Content-Type": stream.headers["content-type"] || "video/mp4",
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-store",
    };
    if (stream.headers["content-length"]) responseHeaders["Content-Length"] = stream.headers["content-length"] as string;
    if (stream.headers["content-range"]) responseHeaders["Content-Range"] = stream.headers["content-range"] as string;

    res.writeHead(status, responseHeaders);
    stream.pipe(res);
  });

  cloudinaryReq.on("error", (err) => {
    if (!res.headersSent) res.status(500).json({ error: `Stream failed: ${err.message}` });
  });
});

export default router;
