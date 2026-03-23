import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { requireAuth, requireRole } from "../lib/auth.js";
import { logAction } from "../lib/logger.js";
import { uploadToCloudinary } from "../lib/cloudinary.js";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const ALLOWED_MIME_TYPES = ["video/mp4", "video/quicktime"]; // mp4 + mov only
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only MP4 and MOV files are allowed"));
    }
  },
});

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
    // Upload to Cloudinary for persistent storage
    const cloudinaryUrl = await uploadToCloudinary(req.file.path, req.file.filename);

    // Delete local temp file
    fs.unlink(req.file.path, () => {});

    await logAction(req.user!.userId, "upload_completed", undefined, {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });

    res.json({
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      cloudinaryUrl,
    });
  } catch (err: any) {
    fs.unlink(req.file.path, () => {});
    res.status(500).json({ error: `Upload failed: ${err.message}` });
  }
});

export default router;
