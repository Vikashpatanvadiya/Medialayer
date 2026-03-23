import {
  useQuery,
  useMutation,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { get, post, del } from "./fetch.js";
import type {
  User,
  Video,
  Notification,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
} from "./types.js";

// ─── Auth ────────────────────────────────────────────────────────────────────

export function useGetCurrentUser(opts?: {
  query?: Omit<UseQueryOptions<User>, "queryKey" | "queryFn">;
}) {
  return useQuery<User>({
    queryKey: ["/api/auth/me"],
    queryFn: () => get<User>("/api/auth/me"),
    ...opts?.query,
  });
}

export function useLogin(opts?: {
  mutation?: UseMutationOptions<AuthResponse, unknown, LoginRequest>;
}) {
  return useMutation<AuthResponse, unknown, LoginRequest>({
    mutationFn: (data) => post<AuthResponse>("/api/auth/login", data),
    ...opts?.mutation,
  });
}

export function useRegister(opts?: {
  mutation?: UseMutationOptions<AuthResponse, unknown, RegisterRequest>;
}) {
  return useMutation<AuthResponse, unknown, RegisterRequest>({
    mutationFn: (data) => post<AuthResponse>("/api/auth/register", data),
    ...opts?.mutation,
  });
}

export function useLogout(opts?: {
  mutation?: UseMutationOptions<unknown, unknown, void>;
}) {
  return useMutation<unknown, unknown, void>({
    mutationFn: () => post("/api/auth/logout"),
    ...opts?.mutation,
  });
}

// ─── Videos ──────────────────────────────────────────────────────────────────

export function useListVideos(
  _?: undefined,
  opts?: { query?: Omit<UseQueryOptions<{ videos: Video[] }>, "queryKey" | "queryFn"> & { queryKey?: string[] } }
) {
  return useQuery<{ videos: Video[] }>({
    queryKey: opts?.query?.queryKey ?? ["/api/videos"],
    queryFn: () => get<{ videos: Video[] }>("/api/videos"),
    ...opts?.query,
  });
}

export function useGetVideo(
  id: string,
  opts?: { query?: Omit<UseQueryOptions<Video>, "queryKey" | "queryFn"> }
) {
  return useQuery<Video>({
    queryKey: [`/api/videos/${id}`],
    queryFn: () => get<Video>(`/api/videos/${id}`),
    ...opts?.query,
  });
}

export function useApproveVideo(opts?: {
  mutation?: UseMutationOptions<Video, unknown, { id: string }>;
}) {
  return useMutation<Video, unknown, { id: string }>({
    mutationFn: ({ id }) => post<Video>(`/api/videos/${id}/approve`),
    ...opts?.mutation,
  });
}

export function useRejectVideo(opts?: {
  mutation?: UseMutationOptions<Video, unknown, { id: string; data: { feedback: string } }>;
}) {
  return useMutation<Video, unknown, { id: string; data: { feedback: string } }>({
    mutationFn: ({ id, data }) => post<Video>(`/api/videos/${id}/reject`, data),
    ...opts?.mutation,
  });
}

export function useDeleteVideo(opts?: {
  mutation?: UseMutationOptions<unknown, unknown, { id: string }>;
}) {
  return useMutation<unknown, unknown, { id: string }>({
    mutationFn: ({ id }) => del(`/api/videos/${id}`),
    ...opts?.mutation,
  });
}

// ─── Notifications ────────────────────────────────────────────────────────────

export function useListNotifications(opts?: {
  query?: Omit<UseQueryOptions<{ notifications: Notification[] }>, "queryKey" | "queryFn">;
}) {
  return useQuery<{ notifications: Notification[] }>({
    queryKey: ["/api/notifications"],
    queryFn: () => get<{ notifications: Notification[] }>("/api/notifications"),
    ...opts?.query,
  });
}

export function useMarkNotificationRead(opts?: {
  mutation?: UseMutationOptions<Notification, unknown, { id: string }>;
}) {
  return useMutation<Notification, unknown, { id: string }>({
    mutationFn: ({ id }) => post<Notification>(`/api/notifications/${id}/read`),
    ...opts?.mutation,
  });
}
