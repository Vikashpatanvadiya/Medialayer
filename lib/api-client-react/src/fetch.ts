const BASE_URL = (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_URL) || "";

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: any = new Error(data?.error || res.statusText);
    err.data = data;
    err.status = res.status;
    throw err;
  }
  return data as T;
}

export function get<T>(url: string): Promise<T> {
  return apiFetch<T>(url);
}

export function post<T>(url: string, body?: unknown): Promise<T> {
  return apiFetch<T>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export function del<T>(url: string): Promise<T> {
  return apiFetch<T>(url, { method: "DELETE" });
}
