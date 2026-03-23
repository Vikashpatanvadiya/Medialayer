import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function uploadToCloudinary(filePath: string, filename: string): Promise<string> {
  const result = await cloudinary.uploader.upload(filePath, {
    resource_type: "video",
    public_id: filename.replace(/\.[^/.]+$/, ""), // strip extension
    folder: "medialayer",
    overwrite: true,
  });
  return result.secure_url;
}

export function getSignedUrl(filename: string): string {
  const publicId = `medialayer/${filename.replace(/\.[^/.]+$/, "")}`;
  return getSignedUrlFromPublicId(publicId);
}

// Use when you already have the full public_id (e.g. extracted from a legacy videoUrl)
export function getSignedUrlFromPublicId(publicId: string): string {
  return cloudinary.url(publicId, {
    resource_type: "video",
    secure: true,
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  });
}

export async function deleteFromCloudinary(filename: string): Promise<void> {
  const publicId = `medialayer/${filename.replace(/\.[^/.]+$/, "")}`;
  await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
}

export async function downloadFromCloudinary(url: string, destPath: string): Promise<void> {
  const https = await import("https");
  const fs = await import("fs");
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Cloudinary returned ${res.statusCode}`));
        return;
      }
      res.pipe(file);
      file.on("finish", () => { file.close(); resolve(); });
    }).on("error", (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

export default cloudinary;
