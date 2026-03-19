/**
 * Intercepts all global fetches to automatically append the Authorization header
 * and handle 401s globally if necessary.
 */
export function setupFetchInterceptor() {
  const originalFetch = window.fetch;
  
  window.fetch = async (...args) => {
    let [resource, config] = args;
    
    // Only intercept /api requests
    const url = resource instanceof Request ? resource.url : resource.toString();
    if (url.includes('/api')) {
      const token = localStorage.getItem('layer_token');
      if (token) {
        config = config || {};
        const headers = new Headers(config.headers || {});
        headers.set('Authorization', `Bearer ${token}`);
        config.headers = headers;
      }
    }

    const response = await originalFetch(resource, config);

    // Global 401 handler
    if (response.status === 401 && !url.includes('/auth/login') && !url.includes('/auth/register') && !url.includes('/auth/me')) {
      localStorage.removeItem('layer_token');
      window.location.href = '/login';
    }

    return response;
  };
}
