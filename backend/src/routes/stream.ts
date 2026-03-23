import { Router, type IRouter } from "express";
import { requireAuth } from "../lib/auth.js";
import { db, videosTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getSignedUrl } from "../lib/cloudinary.js";

const router: IRouter = Router();

// Allow token via query param (browser video tag can't set headers)
router.use((req, _res, next) => {
  if (req.query.token && !req.headers.authorization) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  next();
});

// GET /api/stream/:videoId/url — returns a short-lived signed URL as JSON
// The frontend uses this to set the <video src> directly, avoiding CORS issues
router.get("/:videoId/url", requireAuth, async (req, res) => {
  const { videoId } = req.params as { videoId: string };
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

  const url = getSignedUrl(video.storedFilename);
  // Return as JSON — frontend sets this as <video src>
  res.json({ url });
});

export default router;
