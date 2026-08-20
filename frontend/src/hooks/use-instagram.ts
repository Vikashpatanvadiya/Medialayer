import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiUrl } from "@/lib/api";

export interface InstagramAccount {
  id: string;
  instagramId: string;
  username: string;
  profilePictureUrl: string | null;
  fbPageId: string;
  fbPageName: string | null;
  tokenExpiresAt: string | null;
  createdAt: string;
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
      authFetch<{ configured: boolean; accounts: InstagramAccount[] }>(
        "/api/integrations/instagram/accounts",
      ),
    enabled,
    staleTime: 30_000,
  });
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

/** Opens the Facebook consent popup and resolves once the window reports back. */
export function useConnectInstagram() {
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);

  const connect = useCallback(async (): Promise<{ ok: boolean; detail: string }> => {
    setIsConnecting(true);
    try {
      const { url } = await authFetch<{ url: string }>("/api/integrations/instagram/connect");
      const popup = window.open(url, "instagram-auth", "width=600,height=720,scrollbars=yes");

      return await new Promise((resolve) => {
        let settled = false;
        const finish = (result: { ok: boolean; detail: string }) => {
          if (settled) return;
          settled = true;
          window.removeEventListener("message", onMessage);
          clearInterval(poll);
          clearTimeout(timeout);
          setIsConnecting(false);
          queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY });
          resolve(result);
        };

        const onMessage = (event: MessageEvent) => {
          if (event.data?.type !== "INSTAGRAM_CONNECTED") return;
          popup?.close();
          finish({ ok: Boolean(event.data.ok), detail: String(event.data.detail ?? "") });
        };
        window.addEventListener("message", onMessage);

        // The popup can also just be closed by the user.
        const poll = setInterval(() => {
          if (popup && popup.closed) finish({ ok: false, detail: "Connection window closed." });
        }, 1000);

        const timeout = setTimeout(
          () => finish({ ok: false, detail: "Connection timed out." }),
          5 * 60 * 1000,
        );
      });
    } catch (err: any) {
      setIsConnecting(false);
      return { ok: false, detail: err?.message || "Could not start the Instagram connection." };
    }
  }, [queryClient]);

  return { connect, isConnecting };
}

export function useDisconnectInstagram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (accountId: string) =>
      authFetch(`/api/integrations/instagram/accounts/${accountId}/disconnect`, { method: "POST" }),
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
