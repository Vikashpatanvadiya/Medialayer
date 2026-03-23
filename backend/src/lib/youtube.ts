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
          status: { privacyStatus: "private" },
        },
        media: { body: fs.createReadStream(filePath) },
      });

      const videoId = res.data.id!;
      return {
        youtubeVideoId: videoId,
        youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
      };
    } catch (err: any) {
      lastError = err;
      console.error(`[youtube] Upload attempt ${attempt}/${retries} failed:`, err?.message);
      if (attempt < retries) {
        // Wait 2s before retry
        await new Promise((r) => setTimeout(r, 2000 * attempt));
      }
    }
  }

  throw lastError ?? new Error("YouTube upload failed after retries");
}
