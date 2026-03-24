import { google } from "googleapis";
import fs from "fs";

const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID!;
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET!;

export function getRedirectUri(): string {
  if (process.env.BACKEND_URL) {
    return `${process.env.BACKEND_URL}/api/youtube/oauth-callback`;
  }
  const domain = (process.env.REPLIT_DOMAINS || "").split(",")[0]?.trim();
  return domain
    ? `https://${domain}/api/youtube/oauth-callback`
    : `http://localhost:${process.env.PORT || 3000}/api/youtube/oauth-callback`;
}

export function createOAuth2Client(tokens?: { access_token: string; refresh_token: string; expiry_date: number } | null) {
  const client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, getRedirectUri());
  if (tokens) {
    client.setCredentials(tokens);
  }
  return client;
}

export function getAuthUrl(stateUserId: string): string {
  const client = createOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtube",
      "https://www.googleapis.com/auth/youtube.readonly",
    ],
    state: stateUserId,
  });
}

export interface UploadResult {
  youtubeVideoId: string;
  youtubeUrl: string;
}

export async function uploadVideoToYouTube(
  tokens: { access_token: string; refresh_token: string; expiry_date: number },
  filePath: string,
  title: string,
  description: string,
  tags: string[],
  thumbnailUrl?: string | null,
  retries = 3,
): Promise<UploadResult> {
  const auth = createOAuth2Client(tokens);
  const youtube = google.youtube({ version: "v3", auth });

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await youtube.videos.insert({
        part: ["snippet", "status"],
        requestBody: {
          snippet: { title, description, tags, categoryId: "22" },
          status: { privacyStatus: "public" },
        },
        media: { body: fs.createReadStream(filePath) },
      });

      const videoId = res.data.id!;

      // Set custom thumbnail if provided — requires downloading the image first
      if (thumbnailUrl) {
        try {
          await setYouTubeThumbnail(youtube, videoId, thumbnailUrl);
        } catch (thumbErr: any) {
          // Non-fatal — video is uploaded, thumbnail just won't be set
          console.warn("[youtube] Thumbnail set failed:", thumbErr?.message);
        }
      }

      return {
        youtubeVideoId: videoId,
        youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
      };
    } catch (err: any) {
      lastError = err;
      console.error(`[youtube] Upload attempt ${attempt}/${retries} failed:`, err?.message);
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 2000 * attempt));
      }
    }
  }

  throw lastError ?? new Error("YouTube upload failed after retries");
}

async function setYouTubeThumbnail(
  youtube: ReturnType<typeof google.youtube>,
  videoId: string,
  thumbnailUrl: string,
): Promise<void> {
  const https = await import("https");
  const http = await import("http");
  const os = await import("os");
  const path = await import("path");

  // Determine mime type from URL extension
  const ext = thumbnailUrl.split("?")[0].split(".").pop()?.toLowerCase() || "jpg";
  const mimeMap: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp" };
  const mimeType = mimeMap[ext] || "image/jpeg";

  const tmpPath = path.join(os.tmpdir(), `thumb-${videoId}.${ext}`);

  // Download thumbnail to temp file
  await new Promise<void>((resolve, reject) => {
    const dest = fs.createWriteStream(tmpPath);
    const protocol = thumbnailUrl.startsWith("https") ? https : http;
    protocol.get(thumbnailUrl, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        dest.close();
        fs.unlink(tmpPath, () => {});
        // Follow redirect
        setYouTubeThumbnail(youtube, videoId, res.headers.location!).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) { reject(new Error(`Thumbnail download failed: ${res.statusCode}`)); return; }
      res.pipe(dest);
      dest.on("finish", () => { dest.close(); resolve(); });
    }).on("error", reject);
  });

  // Upload to YouTube thumbnails API
  await youtube.thumbnails.set({
    videoId,
    media: { mimeType, body: fs.createReadStream(tmpPath) },
  });

  fs.unlink(tmpPath, () => {});
}
