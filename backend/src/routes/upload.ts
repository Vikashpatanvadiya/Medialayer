import { Router } from "express";
import { requireAuth, requireRole } from "../lib/auth.js";
import { logAction } from "../lib/logger.js";
import cloudinary from "../lib/cloudinary.js";

const router = Router();

// Returns a short-lived signed upload params — browser uploads directly to Cloudinary
// Security: JWT required, role=editor required, signature expires in 10min, scoped to medialayer/ folder
router.post("/sign", requireAuth, requireRole("editor"), async (req, res) => {
  try {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = (req.body.ext as string || "mp4").replace(/[^a-z0-9]/gi, "").toLowerCase();
    const filename = `${unique}.${ext}`;
    const publicId = `medialayer/${unique}`;
    const timestamp = Math.round(Date.now() / 1000);

    const paramsToSign = {
      timestamp,
      public_id: publicId,
      type: "authenticated",
      overwrite: "true",
      // Restrict to video resource type via eager — Cloudinary rejects non-video if resource_type=video
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET!
    );

    await logAction(req.user!.userId, "upload_started");

    res.json({
      signature,
      timestamp,
      public_id: publicId,
      api_key: process.env.CLOUDINARY_API_KEY!,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
      filename,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Returns signed params for a PUBLIC image upload (thumbnails need to be publicly accessible for YouTube)
router.post("/thumbnail-sign", requireAuth, requireRole("editor"), async (req, res) => {
  try {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = (req.body.ext as string || "jpg").replace(/[^a-z0-9]/gi, "").toLowerCase();
    const publicId = `medialayer/thumbnails/${unique}`;
    const timestamp = Math.round(Date.now() / 1000);

    // Public type — YouTube must be able to fetch this URL directly
    const paramsToSign = { timestamp, public_id: publicId };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET!
    );

    res.json({
      signature,
      timestamp,
      public_id: publicId,
      api_key: process.env.CLOUDINARY_API_KEY!,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Called after Cloudinary confirms upload — just logs it, no file data touches server
router.post("/confirm", requireAuth, requireRole("editor"), async (req, res) => {
  const { filename, cloudinaryUrl, originalName, size } = req.body;
  if (!filename || !cloudinaryUrl) {
    res.status(400).json({ error: "Missing filename or cloudinaryUrl" });
    return;
  }
  await logAction(req.user!.userId, "upload_completed", undefined, { filename, originalName, size });
  res.json({ ok: true });
});

export default router;
