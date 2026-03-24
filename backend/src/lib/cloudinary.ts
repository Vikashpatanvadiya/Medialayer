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
    type: "authenticated", // blocks direct URL access without a valid signature
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
    type: "authenticated",
    secure: true,
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  });
}

export async function deleteFromCloudinary(filename: string): Promise<void> {
  const publicId = `medialayer/${filename.replace(/\.[^/.]+$/, "")}`;
  await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
}

export async function downloadFromCloudinary(filenameOrUrl: string, destPath: string): Promise<void> {
  let downloadUrl: string;
  if (filenameOrUrl.startsWith("http")) {
    downloadUrl = filenameOrUrl;
  } else {
    const publicId = `medialayer/${filenameOrUrl.replace(/\.[^/.]+$/, "")}`;
    downloadUrl = cloudinary.url(publicId, {
      resource_type: "video",
      type: "authenticated",
      secure: true,
      sign_url: true,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    });
  }

  const https = await import("https");
  const http = await import("http");
  const fs = await import("fs");

  const download = (url: string): Promise<void> => new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const protocol = url.startsWith("https") ? https : http;

    const req = protocol.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlink(destPath, () => {});
        return download(res.headers.location!).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error(`Cloudinary download returned ${res.statusCode}`));
        return;
      }
      const total = parseInt(res.headers["content-length"] || "0", 10);
      let received = 0;
      res.on("data", (chunk) => {
        received += chunk.length;
        if (total) process.stdout.write(`\r[cloudinary] Download: ${Math.round(received / total * 100)}%`);
      });
      res.pipe(file);
      file.on("finish", () => { file.close(); console.log("\n[cloudinary] Download complete"); resolve(); });
    }).on("error", (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });

    // 10 minute timeout for large video files
    req.setTimeout(10 * 60 * 1000, () => {
      req.destroy();
      fs.unlink(destPath, () => {});
      reject(new Error("Cloudinary download timed out after 10 minutes"));
    });
  });

  return download(downloadUrl);
}

export default cloudinary;
