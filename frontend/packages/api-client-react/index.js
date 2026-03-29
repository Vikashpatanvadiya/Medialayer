import { useQuery, useMutation } from '@tanstack/react-query';

async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err = new Error(data.error || res.statusText);
    err.data = data;
    throw err;
  }
  return res.json().catch(() => null);
}

export function useGetCurrentUser(opts = {}) {
  return useQuery({ queryKey: ['/api/auth/me'], queryFn: () => apiFetch('/api/auth/me'), retry: false, ...(opts.query || {}) });
}
export function useLogin(opts = {}) {
  return useMutation({ mutationFn: (body) => apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }), ...(opts.mutation || {}) });
}
export function useRegister(opts = {}) {
  return useMutation({ mutationFn: (body) => apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }), ...(opts.mutation || {}) });
}
export function useLogout(opts = {}) {
  return useMutation({ mutationFn: () => apiFetch('/api/auth/logout', { method: 'POST' }), ...(opts.mutation || {}) });
}
export function useListVideos(opts = {}) {
  return useQuery({ queryKey: ['/api/videos'], queryFn: () => apiFetch('/api/videos'), ...(opts.query || {}) });
}
export function useGetVideo(id, opts = {}) {
  return useQuery({ queryKey: ['/api/videos', id], queryFn: () => apiFetch(`/api/videos/${id}`), enabled: !!id, ...(opts.query || {}) });
}
export function useApproveVideo(opts = {}) {
  return useMutation({ mutationFn: (id) => apiFetch(`/api/videos/${id}/approve`, { method: 'POST' }), ...(opts.mutation || {}) });
}
export function useRejectVideo(opts = {}) {
  return useMutation({ mutationFn: ({ id, reason }) => apiFetch(`/api/videos/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }), ...(opts.mutation || {}) });
}
export function useListNotifications(opts = {}) {
  return useQuery({ queryKey: ['/api/notifications'], queryFn: () => apiFetch('/api/notifications'), ...(opts.query || {}) });
}
export function useMarkNotificationRead(opts = {}) {
  return useMutation({ mutationFn: (id) => apiFetch(`/api/notifications/${id}/read`, { method: 'POST' }), ...(opts.mutation || {}) });
}

// Type stubs
export const LoginRequest = {};
export const RegisterRequest = {};
export const User = {};
export const Video = {};
