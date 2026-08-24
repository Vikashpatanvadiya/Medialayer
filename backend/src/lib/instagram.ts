/**
 * Instagram API with Instagram Login (Instagram Business Login).
 *
 * The creator authenticates directly with Instagram — no Facebook Login, no
 * Facebook Page, no Page access token. We receive an Instagram-scoped user id
 * and an Instagram user access token, and publish with the same two-step
 * container → publish flow, on graph.instagram.com.
 *
 * Docs: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login
 */

const API_VERSION = process.env.INSTAGRAM_API_VERSION || "v21.0";

// Overridable so tests can point the client at a stub server.
const AUTH_HOST = process.env.INSTAGRAM_AUTH_HOST || "https://www.instagram.com";
const OAUTH_HOST = process.env.INSTAGRAM_OAUTH_HOST || "https://api.instagram.com";
const GRAPH_HOST = process.env.INSTAGRAM_GRAPH_HOST || "https://graph.instagram.com";

const AUTHORIZE_URL = `${AUTH_HOST}/oauth/authorize`;
const TOKEN_URL = `${OAUTH_HOST}/oauth/access_token`;
const GRAPH = `${GRAPH_HOST}/${API_VERSION}`;

/**
 * Minimum scopes for "connect an account and publish to it".
 * Deliberately excludes comment/message/insights permissions.
 */
export const INSTAGRAM_SCOPES = ["instagram_business_basic", "instagram_business_content_publish"];

export type PostType = "REELS" | "FEED";

export interface InstagramProfile {
  instagramId: string;
  username: string;
  accountType: string | null;
  profilePictureUrl: string | null;
}

export class InstagramApiError extends Error {
  constructor(
    message: string,
    readonly code: number | null,
    readonly subcode: number | null,
    /** True when the only fix is for the user to reconnect their account. */
    readonly needsReconnect: boolean,
    readonly raw?: unknown,
    /**
     * Instagram's own wording, kept even when `message` is replaced with
     * friendlier copy. Without this the original text is unrecoverable for
     * OAuth-style bodies, where `raw` is an empty object.
     */
    readonly detail?: string,
    /** Method + URL that failed, with secrets stripped. Safe to log. */
    readonly endpoint?: string,
  ) {
    super(message);
    this.name = "InstagramApiError";
  }
}

/**
 * Reads an env var, tolerating case differences in the key.
 *
 * Env names are case-sensitive, and a dashboard entry like `Instagram_APP_ID`
 * silently reads as "not configured" — a confusing failure that costs real time.
 * We accept it and say so loudly instead.
 */
function readEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const exact = process.env[name];
    if (exact) return exact;
  }
  const wanted = new Set(names.map((n) => n.toLowerCase()));
  for (const [key, value] of Object.entries(process.env)) {
    if (value && wanted.has(key.toLowerCase())) {
      console.warn(
        `[instagram] Using env var "${key}" — rename it to "${names[0]}" (env names are case-sensitive).`,
      );
      return value;
    }
  }
  return undefined;
}

export function instagramConfig() {
  // Deliberately NOT falling back to META_APP_ID/META_APP_SECRET: those belong
  // to the Facebook app and are rejected by Instagram Login, which fails later
  // and much less clearly than a missing-credentials error here.
  const clientId = readEnv("INSTAGRAM_CLIENT_ID", "INSTAGRAM_APP_ID");
  const clientSecret = readEnv("INSTAGRAM_CLIENT_SECRET", "INSTAGRAM_APP_SECRET");
  const redirectUri =
    readEnv("INSTAGRAM_REDIRECT_URI") ||
    `${process.env.BACKEND_URL || "http://localhost:3000"}/api/integrations/instagram/callback`;
  return { clientId, clientSecret, redirectUri };
}

export function isInstagramConfigured(): boolean {
  const { clientId, clientSecret } = instagramConfig();
  return Boolean(clientId && clientSecret);
}

/**
 * Instagram rejects anything but HTTPS (and, unlike Facebook Login, does not
 * make an exception for localhost). Surfaced early so misconfiguration shows up
 * as a clear message instead of an opaque Instagram error page.
 */
export function validateRedirectUri(uri: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(uri);
  } catch {
    return `INSTAGRAM_REDIRECT_URI is not a valid URL: "${uri}"`;
  }
  if (uri.split("://").length > 2) {
    return `INSTAGRAM_REDIRECT_URI contains a duplicated scheme: "${uri}"`;
  }
  if (parsed.protocol !== "https:") {
    return "Instagram requires an HTTPS redirect URI. Use an HTTPS tunnel (e.g. ngrok) for local development.";
  }
  if (!parsed.hostname.includes(".")) {
    return `INSTAGRAM_REDIRECT_URI has an invalid host: "${parsed.hostname}"`;
  }
  if (!parsed.pathname.endsWith("/api/integrations/instagram/callback")) {
    return `INSTAGRAM_REDIRECT_URI must end with /api/integrations/instagram/callback (got "${parsed.pathname}")`;
  }
  return null;
}

/**
 * Method + URL with every credential stripped, so a failure can name the exact
 * request without ever putting a token, code or secret in a log.
 */
function safeEndpoint(url: string, method: string): string {
  try {
    const u = new URL(url);
    for (const key of ["access_token", "client_secret", "client_id", "code"]) {
      if (u.searchParams.has(key)) u.searchParams.set(key, "…");
    }
    return `${method.toUpperCase()} ${u.origin}${u.pathname}${u.search}`;
  } catch {
    return `${method.toUpperCase()} (unparseable url)`;
  }
}

/** Turns an Instagram API error payload into something a creator can act on. */
function toApiError(payload: any, fallback: string, endpoint?: string): InstagramApiError {
  // Instagram Login returns both Graph-style {error:{...}} and OAuth-style bodies.
  const err = payload?.error ?? {};
  const code: number | null =
    typeof err.code === "number" ? err.code : typeof payload?.code === "number" ? payload.code : null;
  const subcode: number | null = typeof err.error_subcode === "number" ? err.error_subcode : null;
  const raw =
    err.error_user_msg ||
    err.message ||
    payload?.error_message ||
    payload?.error_description ||
    fallback;

  // 190/102/463 are the genuine "this token is dead" codes. A bare
  // OAuthException is far broader — insufficient app role, a permission still
  // on Standard Access, an unapproved scope — and rewriting those as "expired"
  // during an *initial* connect hides the only sentence that says what is
  // actually wrong. Keep needsReconnect broad (it drives the reconnect prompt
  // at publish time) but only replace the wording for real expiry.
  const expired = code === 190 || code === 102 || code === 463;
  const needsReconnect = expired || err.type === "OAuthException";

  let message = raw;
  if (expired) {
    message = "Instagram connection expired. Please reconnect your Instagram account.";
  } else if (code === 4 || code === 17 || code === 32 || code === 613) {
    message = "Instagram rate limit reached. Please try again later.";
  } else if (code === 9007 || subcode === 2207042) {
    message = "Instagram publishing limit reached (25 posts per 24 hours).";
  } else if (subcode === 2207026) {
    message =
      "Instagram rejected this video's format. Reels must be MP4/MOV, 3–900s, up to 1GB, aspect ratio 0.01:1–10:1.";
  } else if (subcode === 2207020 || subcode === 2207003) {
    message = "Instagram could not download the media file. Please try publishing again.";
  } else if (subcode === 2207032) {
    message = "Instagram failed to create the media container. Please try again.";
  }

  return new InstagramApiError(message, code, subcode, needsReconnect, err, raw, endpoint);
}

async function request<T>(url: string, init: RequestInit & { fallback: string }): Promise<T> {
  const { fallback, ...requestInit } = init;
  let res: Response;
  try {
    res = await fetch(url, requestInit);
  } catch (err: any) {
    throw new InstagramApiError(
      `Could not reach Instagram: ${err?.message || "network error"}`,
      null,
      null,
      false,
      err,
    );
  }

  const text = await res.text();
  let payload: any;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { raw: text };
  }

  if (!res.ok || payload?.error || payload?.error_type) {
    throw toApiError(payload, fallback, safeEndpoint(url, requestInit.method ?? "GET"));
  }
  return payload as T;
}

function graphGet<T>(path: string, params: Record<string, string>, fallback: string): Promise<T> {
  return request<T>(`${GRAPH}${path}?${new URLSearchParams(params).toString()}`, {
    method: "GET",
    fallback,
  });
}

function graphPost<T>(path: string, body: Record<string, unknown>, fallback: string): Promise<T> {
  return request<T>(`${GRAPH}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    fallback,
  });
}

// ── OAuth: Instagram Business Login ──────────────────────────────────────────

/** Step 1 — the Instagram (not Facebook) authorization screen. */
export function getInstagramAuthUrl(state: string): string {
  const { clientId, redirectUri } = instagramConfig();
  const params = new URLSearchParams({
    client_id: clientId!,
    redirect_uri: redirectUri,
    scope: INSTAGRAM_SCOPES.join(","),
    response_type: "code",
    state,
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

/**
 * Classifies a token by its prefix so a wrong-credentials setup is obvious in
 * the log. Deliberately returns a label, never the token or any part of it:
 * Instagram Login issues `IGAA…` tokens, Facebook/Meta issues `EAA…`, and
 * putting the Facebook App ID in INSTAGRAM_CLIENT_ID yields the latter — which
 * graph.instagram.com rejects as "Unsupported request" rather than as a bad
 * token, making it otherwise almost impossible to spot.
 */
export function classifyToken(token: string | undefined): string {
  if (!token) return "MISSING";
  if (token.startsWith("IGAA")) return "IGAA (Instagram Login — correct)";
  if (token.startsWith("EAA")) return "EAA (Facebook/Meta — wrong app credentials)";
  return `unrecognised prefix (${token.length} chars)`;
}

/** Step 2 — swap the authorization code for a short-lived Instagram token. */
export async function exchangeCodeForToken(
  code: string,
): Promise<{ accessToken: string; instagramId: string; permissions: string | null }> {
  const { clientId, clientSecret, redirectUri } = instagramConfig();
  const body = new URLSearchParams({
    client_id: clientId!,
    client_secret: clientSecret!,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code,
  });

  const data = await request<{
    access_token: string;
    user_id: number | string;
    permissions?: string[] | string;
  }>(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    fallback: "Could not exchange the Instagram authorization code.",
  });

  // Shape + token class only; no values. This is the single most useful line
  // for telling "wrong app credentials" apart from "wrong response shape".
  console.log(
    `[instagram] Code exchange OK — response keys: [${Object.keys(data).join(", ")}], ` +
      `token: ${classifyToken(data.access_token)}, ` +
      `user_id: ${data.user_id ? "present" : "MISSING"}, ` +
      `permissions: ${data.permissions ? JSON.stringify(data.permissions) : "none"}`,
  );

  return {
    accessToken: data.access_token,
    instagramId: String(data.user_id),
    permissions: Array.isArray(data.permissions)
      ? data.permissions.join(",")
      : (data.permissions ?? null),
  };
}

/** Step 3 — upgrade to a 60-day long-lived token. */
export async function exchangeForLongLivedToken(
  shortLivedToken: string,
): Promise<{ token: string; expiresAt: Date | null }> {
  const { clientSecret } = instagramConfig();
  const data = await request<{ access_token: string; expires_in?: number }>(
    `${GRAPH_HOST}/access_token?${new URLSearchParams({
      grant_type: "ig_exchange_token",
      client_secret: clientSecret!,
      access_token: shortLivedToken,
    })}`,
    { method: "GET", fallback: "Could not extend the Instagram access token." },
  );
  return {
    token: data.access_token,
    expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : null,
  };
}

/**
 * Refreshes a long-lived token for another 60 days. Valid for tokens that are
 * at least 24 hours old and not yet expired.
 */
export async function refreshLongLivedToken(
  longLivedToken: string,
): Promise<{ token: string; expiresAt: Date | null }> {
  const data = await request<{ access_token: string; expires_in?: number }>(
    `${GRAPH_HOST}/refresh_access_token?${new URLSearchParams({
      grant_type: "ig_refresh_token",
      access_token: longLivedToken,
    })}`,
    { method: "GET", fallback: "Could not refresh the Instagram access token." },
  );
  return {
    token: data.access_token,
    expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : null,
  };
}

/** Step 4 — who did we just connect? */
export async function getInstagramProfile(accessToken: string): Promise<InstagramProfile> {
  const data = await graphGet<{
    user_id?: string;
    id?: string;
    username: string;
    account_type?: string;
    profile_picture_url?: string;
  }>(
    "/me",
    {
      fields: "user_id,username,account_type,profile_picture_url",
      access_token: accessToken,
    },
    "Could not read your Instagram profile.",
  );

  return {
    instagramId: String(data.user_id ?? data.id ?? ""),
    username: data.username,
    accountType: data.account_type ?? null,
    profilePictureUrl: data.profile_picture_url ?? null,
  };
}

// ── Publishing ───────────────────────────────────────────────────────────────

/**
 * Creates a media container.
 *
 * Both post types use the REELS container: Meta retired standalone feed video
 * posts, and `share_to_feed` decides whether the reel also appears on the
 * profile grid. Images use the IMAGE container.
 */
export async function createMediaContainer(opts: {
  instagramUserId: string;
  accessToken: string;
  mediaUrl: string;
  caption: string;
  coverUrl?: string | null;
  postType: PostType;
  isImage?: boolean;
}): Promise<string> {
  const body: Record<string, unknown> = opts.isImage
    ? { image_url: opts.mediaUrl, caption: opts.caption, access_token: opts.accessToken }
    : {
        media_type: "REELS",
        video_url: opts.mediaUrl,
        caption: opts.caption,
        share_to_feed: opts.postType === "FEED",
        access_token: opts.accessToken,
      };

  if (!opts.isImage && opts.coverUrl) body.cover_url = opts.coverUrl;

  const data = await graphPost<{ id: string }>(
    `/${opts.instagramUserId}/media`,
    body,
    "Instagram rejected the media container request.",
  );
  return data.id;
}

export type ContainerStatus = "IN_PROGRESS" | "FINISHED" | "ERROR" | "EXPIRED" | "PUBLISHED";

export async function getContainerStatus(
  containerId: string,
  accessToken: string,
): Promise<{ status: ContainerStatus; detail: string | null }> {
  const data = await graphGet<{ status_code?: ContainerStatus; status?: string }>(
    `/${containerId}`,
    { fields: "status_code,status", access_token: accessToken },
    "Could not read the Instagram upload status.",
  );
  return {
    status: (data.status_code ?? "IN_PROGRESS") as ContainerStatus,
    detail: data.status ?? null,
  };
}

/**
 * Polls until Instagram has finished ingesting the media. Instagram downloads
 * and transcodes server-side, so this can take a few minutes for video.
 */
export async function waitForContainer(
  containerId: string,
  accessToken: string,
  opts: { timeoutMs?: number; intervalMs?: number; onTick?: (status: ContainerStatus) => void } = {},
): Promise<void> {
  const timeoutMs = opts.timeoutMs ?? 8 * 60 * 1000;
  const intervalMs = opts.intervalMs ?? 5000;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const { status, detail } = await getContainerStatus(containerId, accessToken);
    opts.onTick?.(status);

    if (status === "FINISHED" || status === "PUBLISHED") return;
    if (status === "ERROR") {
      throw new InstagramApiError(
        `Instagram could not process this media${detail ? ` (${detail})` : ""}. Check the format: MP4/MOV, 3–900s, up to 1GB.`,
        null,
        null,
        false,
      );
    }
    if (status === "EXPIRED") {
      throw new InstagramApiError(
        "The Instagram upload expired before it could be published. Please try again.",
        null,
        null,
        false,
      );
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new InstagramApiError(
    "Instagram is still processing this media. It may still publish — check your Instagram account before retrying.",
    null,
    null,
    false,
  );
}

export async function publishContainer(opts: {
  instagramUserId: string;
  containerId: string;
  accessToken: string;
}): Promise<string> {
  const data = await graphPost<{ id: string }>(
    `/${opts.instagramUserId}/media_publish`,
    { creation_id: opts.containerId, access_token: opts.accessToken },
    "Instagram rejected the publish request.",
  );
  return data.id;
}

/** Public URL of a published post, e.g. https://www.instagram.com/reel/ABC123/ */
export async function getMediaPermalink(
  mediaId: string,
  accessToken: string,
): Promise<string | null> {
  try {
    const data = await graphGet<{ permalink?: string }>(
      `/${mediaId}`,
      { fields: "permalink", access_token: accessToken },
      "Could not read the Instagram post link.",
    );
    return data.permalink ?? null;
  } catch {
    // A missing permalink must never fail an otherwise successful publish.
    return null;
  }
}

/** Remaining posts in the rolling 24h publishing quota (25 by default). */
export async function getPublishingLimit(
  instagramUserId: string,
  accessToken: string,
): Promise<{ used: number; quota: number } | null> {
  try {
    const data = await graphGet<{
      data?: Array<{ quota_usage?: number; config?: { quota_total?: number } }>;
    }>(
      `/${instagramUserId}/content_publishing_limit`,
      { fields: "config,quota_usage", access_token: accessToken },
      "Could not read the Instagram publishing limit.",
    );
    const row = data.data?.[0];
    if (!row) return null;
    return { used: row.quota_usage ?? 0, quota: row.config?.quota_total ?? 25 };
  } catch {
    return null;
  }
}
