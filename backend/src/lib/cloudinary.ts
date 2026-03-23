import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function uploadToCloudinary(filePath: string, filename: string): Promise<string> {
  const result = await cloudinary.uploader.upload(filePath, {
    resource_type: "video",
    public_id: filename,
    folder: "medialayer",
    overwrite: true,
  });
  return result.secure_url;
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(`medialayer/${publicId}`, { resource_type: "video" });
}

export async function downloadFromCloudinary(url: string, destPath: string): Promise<void> {
  const https = await import("https");
  const fs = await import("fs");
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (res) => {
      res.pipe(file);
      file.on("finish", () => { file.close(); resolve(); });
    }).on("error", (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

export default cloudinary;
