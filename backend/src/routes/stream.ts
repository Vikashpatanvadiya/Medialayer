import { Router, type IRouter } from "express";
import { requireAuth } from "../lib/auth.js";
import { db, videosTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getSignedUrl, getSignedUrlFromPublicId } from "../lib/cloudinary.js";

const router: IRouter = Router();

// Allow token via query param (browser video tag can't set headers)
router.use((req, _res, next) => {
  if (req.query.token && !req.headers.authorization) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  next();
});

// GET /api/stream/:videoId/url — returns a short-lived signed URL as JSON
router.get("/:videoId/url", requireAuth, async (req, res) => {
  const { videoId } = req.params as { videoId: string };
  const user = req.user!;

  const [video] = await db.select().from(videosTable).where(eq(videosTable.id, videoId)).limit(1);

  if (!video) { res.status(404).json({ error: "Video not found" }); return; }

  if (video.creatorId !== user.userId && video.editorId !== user.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  let url: string | null = null;

  if (video.storedFilename) {
    // Normal case: use storedFilename to build signed URL
    url = getSignedUrl(video.storedFilename);
  } else if (video.videoUrl?.includes("cloudinary.com")) {
    // Legacy case: extract public_id from the stored Cloudinary URL
    // URL format: https://res.cloudinary.com/<cloud>/video/upload/<transformations>/<public_id>.<ext>
    const match = video.videoUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
    if (match?.[1]) {
      url = getSignedUrlFromPublicId(match[1]);
    }
  }

  if (!url) {
    res.status(404).json({ error: "No video file available" });
    return;
  }

  res.json({ url });
});

export default router;
