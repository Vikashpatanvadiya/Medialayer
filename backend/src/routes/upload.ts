import { Router } from "express";
import multer from "multer";
import { requireAuth, requireRole } from "../lib/auth.js";
import { logAction } from "../lib/logger.js";
import cloudinary from "../lib/cloudinary.js";
import { Readable } from "stream";

const ALLOWED_MIME_TYPES = ["video/mp4", "video/quicktime"];
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB — Render proxy hard limit

// Use memory storage — no disk write, pipe straight to Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only MP4 and MOV files are allowed"));
    }
  },
});

function uploadBufferToCloudinary(buffer: Buffer, filename: string): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const publicId = filename.replace(/\.[^/.]+$/, "");
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "video",
        public_id: publicId,
        folder: "medialayer",
        overwrite: true,
        type: "authenticated",
      },
      (error, result) => {
        if (error || !result) return reject(error || new Error("Cloudinary upload failed"));
        resolve(result as any);
      }
    );
    Readable.from(buffer).pipe(stream);
  });
}

const router = Router();

router.post("/video", requireAuth, requireRole("editor"), (req, res, next) => {
  logAction(req.user!.userId, "upload_started");
  next();
}, upload.single("video"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No video file uploaded" });
    return;
  }

  try {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = req.file.originalname.split(".").pop() || "mp4";
    const filename = `${unique}.${ext}`;

    const result = await uploadBufferToCloudinary(req.file.buffer, filename);

    await logAction(req.user!.userId, "upload_completed", undefined, {
      filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });

    res.json({
      filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      cloudinaryUrl: result.secure_url,
    });
  } catch (err: any) {
    res.status(500).json({ error: `Upload failed: ${err.message}` });
  }
});

export default router;
