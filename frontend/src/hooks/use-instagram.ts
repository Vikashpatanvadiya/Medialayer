import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiUrl } from "@/lib/api";

export interface InstagramAccount {
  id: string;
  instagramUserId: string;
  username: string;
  profilePictureUrl: string | null;
  accountType: string | null;
  connectedAt: string;
  tokenExpiresAt: string | null;
}

export type InstagramPostType = "REELS" | "FEED";
export type InstagramPostStatus = "PENDING" | "PUBLISHED" | "FAILED";

export interface InstagramPost {
  id: string;
  videoId: string;
  postType: InstagramPostType;
  status: InstagramPostStatus;
  instagramPostId: string | null;
  permalink: string | null;
  caption: string;
  coverUrl: string | null;
  errorMessage: string | null;
  publishedAt: string | null;
  createdAt: string;
  account: { id: string; username: string; profilePictureUrl: string | null };
}

const ACCOUNTS_KEY = ["/api/integrations/instagram/accounts"];
const postsKey = (videoId: string) => [`/api/videos/${videoId}/instagram-posts`];

async function authFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem("layer_token");
  const res = await fetch(apiUrl(path), {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any)?.error || `Request failed (${res.status})`);
  return data as T;
}

/** Connected Instagram accounts for the signed-in creator. */
export function useInstagramAccounts(enabled: boolean) {
  return useQuery({
    queryKey: ACCOUNTS_KEY,
    queryFn: () =>
      authFetch<{ configured: boolean; connected: boolean; accounts: InstagramAccount[] }>(
        "/api/integrations/instagram/accounts",
      ),
    enabled,
    staleTime: 30_000,
  });
}

/** Human-readable copy for each `?instagram=error&reason=…` the callback sets. */
const CONNECT_ERRORS: Record<string, string> = {
  cancelled: "Instagram connection was cancelled.",
  denied: "Instagram access was denied. MediaLayer needs permission to publish on your behalf.",
  missing_code: "Instagram didn't return an authorization code. Please try connecting again.",
  invalid_state:
    "That connection link was already used or expired. Please click Connect Instagram again.",
  exchange_failed:
    "This Instagram account could not be connected. Make sure you're using a Professional (Business or Creator) account.",
  server_error: "Something went wrong on our side. Please try connecting again in a moment.",
};

export interface ConnectOutcome {
  status: "connected" | "error";
  username?: string;
  message: string;
}

/**
 * Reads the result Instagram's callback appended to the URL, then strips those
 * params so a refresh doesn't replay the message.
 */
export function readConnectOutcome(): ConnectOutcome | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const result = params.get("instagram");
  if (!result) return null;

  const outcome: ConnectOutcome =
    result === "connected"
      ? {
          status: "connected",
          username: params.get("username") ?? undefined,
          message: params.get("username")
            ? `@${params.get("username")} is now connected.`
            : "Instagram account connected.",
        }
      : {
          status: "error",
          message:
            CONNECT_ERRORS[params.get("reason") ?? ""] ??
            params.get("message") ??
            "This Instagram account could not be connected.",
        };

  for (const key of ["instagram", "username", "reason", "message"]) params.delete(key);
  const query = params.toString();
  window.history.replaceState(
    {},
    "",
    `${window.location.pathname}${query ? `?${query}` : ""}`,
  );
  return outcome;
}

/**
 * Publish history for a video. Polls while anything is still uploading, since
 * Instagram ingests the video server-side and that takes a minute or two.
 */
export function useInstagramPosts(videoId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: postsKey(videoId ?? ""),
    queryFn: () => authFetch<{ posts: InstagramPost[] }>(`/api/videos/${videoId}/instagram-posts`),
    enabled: enabled && !!videoId,
    refetchInterval: (query) =>
      query.state.data?.posts.some((p) => p.status === "PENDING") ? 5000 : false,
  });
}

/**
 * Sends the creator to Instagram's own login/authorize screen.
 *
 * The URL is built server-side (with a single-use state stored in the database);
 * the browser then navigates to instagram.com. We fetch it rather than linking
 * straight at `/api/…/connect` because the API is Bearer-authenticated and a
 * plain navigation carries no Authorization header.
 */
export function useConnectInstagram() {
  const [isConnecting, setIsConnecting] = useState(false);

  const connect = useCallback(async (): Promise<{ ok: boolean; detail: string }> => {
    setIsConnecting(true);
    try {
      const { url } = await authFetch<{ url: string }>("/api/integrations/instagram/connect");
      window.location.href = url;
      return { ok: true, detail: "Redirecting to Instagram…" };
    } catch (err: any) {
      setIsConnecting(false);
      return { ok: false, detail: err?.message || "Could not start the Instagram connection." };
    }
  }, []);

  return { connect, isConnecting };
}

export function useDisconnectInstagram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (accountId: string) =>
      authFetch(`/api/integrations/instagram/accounts/${accountId}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY }),
  });
}

export interface PublishInput {
  instagramAccountId: string;
  postType: InstagramPostType;
  caption: string;
  coverUrl?: string | null;
}

export function usePublishToInstagram(videoId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PublishInput) =>
      authFetch<{ success: boolean; post: { id: string; status: InstagramPostStatus } }>(
        `/api/videos/${videoId}/publish/instagram`,
        { method: "POST", body: JSON.stringify(input) },
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: postsKey(videoId ?? "") }),
  });
}
