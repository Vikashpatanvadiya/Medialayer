/**
 * Intercepts all global fetches to automatically append the Authorization header,
 * prefix API calls with the backend URL, and handle 401s globally.
 */

// In production, set VITE_API_URL to your Railway backend URL
// e.g. https://your-app.up.railway.app
const API_BASE = (import.meta as any).env?.VITE_API_URL || "";

export function setupFetchInterceptor() {
  const originalFetch = window.fetch;
  
  window.fetch = async (...args) => {
    let [resource, config] = args;
    
    let url = resource instanceof Request ? resource.url : resource.toString();

    // Prefix relative /api calls with the backend base URL
    if (url.startsWith("/api") && API_BASE) {
      url = `${API_BASE}${url}`;
      resource = resource instanceof Request ? new Request(url, resource) : url;
    }

    // Only attach auth header for API requests
    if (url.includes("/api")) {
      const token = localStorage.getItem("layer_token");
      if (token) {
        config = config || {};
        const headers = new Headers(config.headers || {});
        headers.set("Authorization", `Bearer ${token}`);
        config.headers = headers;
      }
    }

    const response = await originalFetch(resource, config);

    // Global 401 handler
    if (response.status === 401 && !url.includes("/auth/login") && !url.includes("/auth/register") && !url.includes("/auth/me")) {
      localStorage.removeItem("layer_token");
      window.location.href = "/login";
    }

    return response;
  };
}
