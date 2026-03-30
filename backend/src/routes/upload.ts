import { Router } from "express";
import multer from "multer";
import { requireAuth, requireRole } from "../lib/auth.js";
import { logAction } from "../lib/logger.js";
import cloudinary from "../lib/cloudinary.js";
import { Readable } from "stream";

const ALLOWED_MIME_TYPES = ["video/mp4", "video/quicktime"];
const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB hard cap — fits in Render free RAM

// Magic bytes for MP4 and MOV — validates actual file content, not just MIME claim
const MAGIC_BYTES: { bytes: number[]; offset: number }[] = [
  { bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }, // MP4: 'ftyp' at offset 4
  { bytes: [0x00, 0x00, 0x00, 0x14, 0x66, 0x74, 0x79, 0x70], offset: 0 }, // MP4 variant
  { bytes: [0x6D, 0x6F, 0x6F, 0x76], offset: 4 }, // MOV: 'moov'
  { bytes: [0x77, 0x69, 0x64, 0x65], offset: 4 }, // MOV: 'wide'
  { bytes: [0x6D, 0x64, 0x61, 0x74], offset: 4 }, // MOV: 'mdat'
];

function isValidVideoBuffer(buf: Buffer): boolean {
  return MAGIC_BYTES.some(({ bytes, offset }) =>
    offset + bytes.length <= buf.length &&
    bytes.every((b, i) => buf[offset + i] === b)
  );
}

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

function uploadBufferToCloudinary(buffer: Buffer, filename: string): Promise<{ secure_url: string }> {
  return new Promise((resolve, reject) => {
    const publicId = `medialayer/${filename.replace(/\.[^/.]+$/, "")}`;
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "video", public_id: publicId, overwrite: true, type: "authenticated" },
      (error, result) => {
        if (error || !result) return reject(error || new Error("Cloudinary upload failed"));
        resolve(result as any);
      }
    );
    Readable.from(buffer).pipe(stream);
  });
}

const router = Router();

router.post("/video", requireAuth, requireRole("editor"), upload.single("video"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No video file uploaded" });
    return;
  }

  // Validate actual file bytes — prevents MIME spoofing
  if (!isValidVideoBuffer(req.file.buffer)) {
    res.status(400).json({ error: "File content does not match a valid MP4 or MOV" });
    return;
  }

  try {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = req.file.originalname.split(".").pop()?.toLowerCase() || "mp4";
    const filename = `${unique}.${ext}`;

    const result = await uploadBufferToCloudinary(req.file.buffer, filename);

    await logAction(req.user!.userId, "upload_completed", undefined, {
      filename, originalName: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype,
    });

    res.json({
      filename,
      originalName: req.file.originalname,
      size: req.file.size,
      cloudinaryUrl: result.secure_url,
    });
  } catch (err: any) {
    res.status(500).json({ error: `Upload failed: ${err.message}` });
  }
});

export default router;
