/**
 * Instagram Graph API client (content publishing via Facebook Login).
 *
 * Publishing is a two-step process: create a media container, wait for Instagram
 * to finish ingesting the video, then publish the container.
 * Docs: https://developers.facebook.com/docs/instagram-platform/content-publishing
 */

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v21.0";
// META_GRAPH_BASE exists so tests can point the client at a stub Graph server.
const GRAPH_HOST = process.env.META_GRAPH_BASE || "https://graph.facebook.com";
const GRAPH = `${GRAPH_HOST}/${GRAPH_VERSION}`;
const OAUTH_DIALOG = `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`;

/** Minimum scopes needed to list Pages and publish to their IG accounts. */
export const INSTAGRAM_SCOPES = [
  "instagram_basic",
  "instagram_content_publish",
  "pages_show_list",
  "pages_read_engagement",
  // Pages under a Meta Business are omitted from /me/accounts without this.
  "business_management",
];

export type PostType = "REELS" | "FEED";

export interface DiscoveredAccount {
  instagramId: string;
  username: string;
  profilePictureUrl: string | null;
  fbPageId: string;
  fbPageName: string | null;
  /** Page access token — the credential used for publishing. */
  pageAccessToken: string;
}

export class InstagramApiError extends Error {
  constructor(
    message: string,
    readonly code: number | null,
    readonly subcode: number | null,
    /** True when the only fix is for the user to reconnect their account. */
    readonly needsReconnect: boolean,
    readonly raw?: unknown,
  ) {
    super(message);
    this.name = "InstagramApiError";
  }
}

export function instagramConfig() {
  const appId = process.env.META_APP_ID || process.env.INSTAGRAM_APP_ID;
  const appSecret = process.env.META_APP_SECRET || process.env.INSTAGRAM_APP_SECRET;
  const redirectUri =
    process.env.INSTAGRAM_REDIRECT_URI ||
    `${process.env.BACKEND_URL || "http://localhost:3000"}/api/integrations/instagram/callback`;
  // Set only for "Facebook Login for Business" apps, where the permission set
  // lives in a dashboard configuration instead of a `scope` parameter.
  const loginConfigId = process.env.META_LOGIN_CONFIG_ID;
  return { appId, appSecret, redirectUri, loginConfigId };
}

export function isInstagramConfigured(): boolean {
  const { appId, appSecret } = instagramConfig();
  return Boolean(appId && appSecret);
}

/** Turns a Graph API error payload into something a creator can act on. */
function toApiError(payload: any, fallback: string): InstagramApiError {
  const err = payload?.error ?? {};
  const code: number | null = typeof err.code === "number" ? err.code : null;
  const subcode: number | null = typeof err.error_subcode === "number" ? err.error_subcode : null;
  const raw = err.error_user_msg || err.message || fallback;

  // 190 = access token invalid/expired/revoked.
  const needsReconnect = code === 190 || code === 102 || code === 463;

  let message = raw;
  if (needsReconnect) {
    message = "Instagram connection expired. Please reconnect your Instagram account.";
  } else if (code === 4 || code === 17 || code === 32 || code === 613) {
    message = "Instagram rate limit reached. Please try again later.";
  } else if (code === 9007 || subcode === 2207042) {
    message = "Instagram publishing limit reached (25 posts per 24 hours).";
  } else if (subcode === 2207026) {
    message =
      "Instagram rejected this video's format. Reels must be MP4/MOV, 3–900s, up to 1GB, aspect ratio 0.01:1–10:1.";
  } else if (subcode === 2207020 || subcode === 2207003) {
    message = "Instagram could not download the video file. Please try publishing again.";
  } else if (subcode === 2207032) {
    message = "Instagram failed to create the media container. Please try again.";
  }

  return new InstagramApiError(message, code, subcode, needsReconnect, err);
}

async function graphRequest<T>(
  url: string,
  init: RequestInit & { fallback: string },
): Promise<T> {
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

  if (!res.ok || payload?.error) throw toApiError(payload, fallback);
  return payload as T;
}

function graphGet<T>(path: string, params: Record<string, string>, fallback: string): Promise<T> {
  const url = `${GRAPH}${path}?${new URLSearchParams(params).toString()}`;
  return graphRequest<T>(url, { method: "GET", fallback });
}

function graphPost<T>(path: string, body: Record<string, unknown>, fallback: string): Promise<T> {
  return graphRequest<T>(`${GRAPH}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    fallback,
  });
}

// ── OAuth ────────────────────────────────────────────────────────────────────

export function getInstagramAuthUrl(state: string): string {
  const { appId, redirectUri, loginConfigId } = instagramConfig();
  const params = new URLSearchParams({
    client_id: appId!,
    redirect_uri: redirectUri,
    state,
    response_type: "code",
    // Force Facebook to re-ask for Pages instead of reusing an old grant.
    auth_type: "rerequest",
  });

  if (loginConfigId) {
    // Facebook Login for Business: the configuration carries the permissions.
    params.set("config_id", loginConfigId);
  } else {
    params.set("scope", INSTAGRAM_SCOPES.join(","));
  }

  return `${OAUTH_DIALOG}?${params.toString()}`;
}

/** Exchanges the OAuth code for a short-lived user access token. */
export async function exchangeCodeForToken(code: string): Promise<string> {
  const { appId, appSecret, redirectUri } = instagramConfig();
  const data = await graphGet<{ access_token: string }>(
    "/oauth/access_token",
    {
      client_id: appId!,
      client_secret: appSecret!,
      redirect_uri: redirectUri,
      code,
    },
    "Could not exchange the Instagram authorization code.",
  );
  return data.access_token;
}

/** Upgrades a short-lived user token to a ~60 day long-lived token. */
export async function exchangeForLongLivedToken(
  shortLivedToken: string,
): Promise<{ token: string; expiresAt: Date | null }> {
  const { appId, appSecret } = instagramConfig();
  const data = await graphGet<{ access_token: string; expires_in?: number }>(
    "/oauth/access_token",
    {
      grant_type: "fb_exchange_token",
      client_id: appId!,
      client_secret: appSecret!,
      fb_exchange_token: shortLivedToken,
    },
    "Could not extend the Instagram access token.",
  );
  return {
    token: data.access_token,
    expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : null,
  };
}

type GraphIgAccount = {
  id: string;
  username?: string;
  profile_picture_url?: string;
};

type GraphPage = {
  id: string;
  name?: string;
  access_token?: string;
  instagram_business_account?: GraphIgAccount;
  connected_instagram_account?: GraphIgAccount;
};

const PAGE_FIELDS =
  "id,name,access_token,instagram_business_account{id,username,profile_picture_url},connected_instagram_account{id,username,profile_picture_url}";

function mapPageToAccount(page: GraphPage): DiscoveredAccount | null {
  const ig = page.instagram_business_account ?? page.connected_instagram_account;
  if (!ig?.id || !page.access_token) return null;
  return {
    instagramId: ig.id,
    username: ig.username || "instagram",
    profilePictureUrl: ig.profile_picture_url ?? null,
    fbPageId: page.id,
    fbPageName: page.name ?? null,
    pageAccessToken: page.access_token,
  };
}

async function listPages(
  path: string,
  userAccessToken: string,
): Promise<GraphPage[]> {
  try {
    const data = await graphGet<{ data?: GraphPage[] }>(
      path,
      { fields: PAGE_FIELDS, limit: "50", access_token: userAccessToken },
      "Could not read your Facebook Pages.",
    );
    return data.data ?? [];
  } catch (err: any) {
    console.warn(`[instagram] ${path} failed:`, err?.message || err);
    return [];
  }
}

async function loadPageById(
  pageId: string,
  userAccessToken: string,
): Promise<GraphPage | null> {
  try {
    return await graphGet<GraphPage>(
      `/${pageId}`,
      { fields: PAGE_FIELDS, access_token: userAccessToken },
      "Could not read the Facebook Page.",
    );
  } catch (err: any) {
    console.warn(`[instagram] Page ${pageId} lookup failed:`, err?.message || err);
    return null;
  }
}

/**
 * Facebook Login for Business stores granted Pages on the token as
 * granular_scopes.target_ids. /me/accounts is often empty for those Pages.
 */
async function pageIdsFromToken(userAccessToken: string): Promise<string[]> {
  const { appId, appSecret } = instagramConfig();
  if (!appId || !appSecret) return [];

  try {
    const data = await graphGet<{
      data?: {
        scopes?: string[];
        granular_scopes?: Array<{ scope?: string; target_ids?: string[] }>;
      };
    }>(
      "/debug_token",
      {
        input_token: userAccessToken,
        access_token: `${appId}|${appSecret}`,
      },
      "Could not inspect the Facebook access token.",
    );

    const granted = data.data ?? {};
    console.log(`[instagram] token scopes: ${(granted.scopes ?? []).join(", ") || "(none)"}`);

    const pageIds = new Set<string>();
    for (const entry of granted.granular_scopes ?? []) {
      const scope = entry.scope ?? "";
      if (!scope.startsWith("pages_") && scope !== "business_management") continue;
      for (const id of entry.target_ids ?? []) pageIds.add(id);
    }
    console.log(
      `[instagram] granular Page IDs: ${[...pageIds].join(", ") || "(none)"}`,
    );
    return [...pageIds];
  } catch (err: any) {
    console.warn("[instagram] debug_token failed:", err?.message || err);
    return [];
  }
}

export interface InstagramDiscoveryResult {
  accounts: DiscoveredAccount[];
  /** Facebook Pages the token can actually see. */
  pageNames: string[];
}

/**
 * Lists every Instagram Business/Creator account reachable from the user's
 * Facebook Pages. Page tokens derived from a long-lived user token do not
 * expire, so they are what we store for publishing.
 */
export async function discoverInstagramAccounts(
  userAccessToken: string,
): Promise<InstagramDiscoveryResult> {
  const byId = new Map<string, GraphPage>();

  for (const page of [
    ...(await listPages("/me/accounts", userAccessToken)),
    ...(await listPages("/me/assigned_pages", userAccessToken)),
  ]) {
    if (page.id) byId.set(page.id, page);
  }

  console.log(
    `[instagram] listed ${byId.size} page(s): ${[...byId.values()].map((p) => p.name || p.id).join(", ") || "(none)"}`,
  );

  if (byId.size === 0) {
    for (const pageId of await pageIdsFromToken(userAccessToken)) {
      const page = await loadPageById(pageId, userAccessToken);
      if (page?.id) byId.set(page.id, page);
    }
  }

  const pages = [...byId.values()];
  const pageNames = pages.map((page) => page.name || page.id);
  let accounts = pages.map(mapPageToAccount).filter((a): a is DiscoveredAccount => a !== null);

  if (accounts.length === 0) {
    for (const page of pages) {
      const token = page.access_token || userAccessToken;
      const detail = await loadPageById(page.id, token);
      const mapped = mapPageToAccount({
        ...detail,
        id: page.id,
        access_token: detail?.access_token || page.access_token,
      });
      if (mapped) accounts.push(mapped);
    }
  }

  return { accounts, pageNames };
}

/** Revokes the app's permissions for this account (best effort). */
export async function revokeInstagramAccess(
  instagramUserId: string,
  accessToken: string,
): Promise<void> {
  await graphRequest(`${GRAPH}/${instagramUserId}/permissions`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ access_token: accessToken }),
    fallback: "Could not revoke Instagram access.",
  });
}

// ── Publishing ───────────────────────────────────────────────────────────────

/**
 * Creates a media container for a video.
 *
 * Both post types use the REELS container: Meta retired standalone feed video
 * posts, and `share_to_feed` is now what decides whether the reel also appears
 * on the profile feed grid.
 */
export async function createMediaContainer(opts: {
  instagramUserId: string;
  accessToken: string;
  videoUrl: string;
  caption: string;
  coverUrl?: string | null;
  postType: PostType;
}): Promise<string> {
  const body: Record<string, unknown> = {
    media_type: "REELS",
    video_url: opts.videoUrl,
    caption: opts.caption,
    share_to_feed: opts.postType === "FEED",
    access_token: opts.accessToken,
  };
  if (opts.coverUrl) body.cover_url = opts.coverUrl;

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
  return { status: (data.status_code ?? "IN_PROGRESS") as ContainerStatus, detail: data.status ?? null };
}

/**
 * Polls until Instagram has finished ingesting the video. Videos are fetched
 * and transcoded server-side by Instagram, so this can take a few minutes.
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
        `Instagram could not process this video${detail ? ` (${detail})` : ""}. Check the format: MP4/MOV, 3–900s, up to 1GB.`,
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
    "Instagram is still processing this video. It may still publish — check your Instagram account before retrying.",
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
