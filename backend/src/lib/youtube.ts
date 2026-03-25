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
): Promise<UploadResult & { refreshedTokens?: { access_token: string; refresh_token: string; expiry_date: number } }> {
  const auth = createOAuth2Client(tokens);
  let refreshedTokens: { access_token: string; refresh_token: string; expiry_date: number } | undefined;

  // Always try to refresh — access tokens expire after 1hr and expiry_date may be unreliable
  try {
    const { credentials } = await auth.refreshAccessToken();
    auth.setCredentials(credentials);
    refreshedTokens = {
      access_token: credentials.access_token!,
      refresh_token: credentials.refresh_token || tokens.refresh_token,
      expiry_date: credentials.expiry_date as number,
    };
    console.log("[youtube] Access token refreshed");
  } catch (refreshErr: any) {
    console.error("[youtube] Token refresh failed:", refreshErr?.message);
    throw new Error("Unauthorized — YouTube token expired. Please reconnect YouTube.");
  }

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

      // Set thumbnail in background — don't block the upload result
      if (thumbnailUrl) {
        setYouTubeThumbnail(youtube, videoId, thumbnailUrl)
          .catch((e: any) => console.warn("[youtube] Thumbnail set failed:", e?.message));
      }

      return {
        youtubeVideoId: videoId,
        youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
        refreshedTokens,
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
  const urlPath = thumbnailUrl.split("?")[0];
  const ext = urlPath.split(".").pop()?.toLowerCase() || "jpg";
  const mimeMap: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp" };
  const mimeType = mimeMap[ext] || "image/jpeg";

  // Use only videoId for temp filename — never use URL as path
  const tmpPath = path.join(os.tmpdir(), `thumb-${videoId}.${mimeType === "image/png" ? "png" : "jpg"}`);

  // Download thumbnail to temp file (10s timeout)
  await new Promise<void>((resolve, reject) => {
    const dest = fs.createWriteStream(tmpPath);
    dest.on("error", reject); // catch WriteStream errors before piping
    const protocol = thumbnailUrl.startsWith("https") ? https : http;
    const req = protocol.get(thumbnailUrl, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        dest.close();
        fs.unlink(tmpPath, () => {});
        setYouTubeThumbnail(youtube, videoId, res.headers.location!).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) { reject(new Error(`Thumbnail download failed: ${res.statusCode}`)); return; }
      res.pipe(dest);
      dest.on("finish", () => { dest.close(); resolve(); });
    }).on("error", reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error("Thumbnail download timed out")); });
  });

  // Upload to YouTube thumbnails API
  await youtube.thumbnails.set({
    videoId,
    media: { mimeType, body: fs.createReadStream(tmpPath) },
  });

  fs.unlink(tmpPath, () => {});
}
