import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { requireAuth, requireRole } from "../lib/auth.js";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm", "video/mpeg", "video/x-matroska"];
    if (allowed.includes(file.mimetype) || file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only video files are allowed"));
    }
  },
});

const router = Router();

router.post("/video", requireAuth, requireRole("editor"), upload.single("video"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No video file uploaded" });
    return;
  }

  res.json({
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
  });
});

export default router;
