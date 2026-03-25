export const API_BASE = import.meta.env.VITE_API_URL || "";

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

// Ping the backend every 14 minutes to prevent Render free tier cold starts
function keepAlive() {
  fetch(apiUrl("/api/healthz")).catch(() => {});
}
keepAlive(); // ping immediately on page load
setInterval(keepAlive, 14 * 60 * 1000); // then every 14 minutes
