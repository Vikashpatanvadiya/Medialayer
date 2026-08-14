/* MediaLayer service worker — offline shell, runtime caching, update flow.
 *
 * Bump SW_VERSION whenever this file's caching behaviour changes; old caches
 * are dropped on activate.
 */
const SW_VERSION = "v1";

const SHELL_CACHE = `medialayer-shell-${SW_VERSION}`;
const ASSET_CACHE = `medialayer-assets-${SW_VERSION}`;
const IMAGE_CACHE = `medialayer-images-${SW_VERSION}`;
const FONT_CACHE = `medialayer-fonts-${SW_VERSION}`;
const CURRENT_CACHES = [SHELL_CACHE, ASSET_CACHE, IMAGE_CACHE, FONT_CACHE];

const OFFLINE_URL = "/offline.html";

/** Minimal shell so a cold, offline launch still renders something on brand. */
const PRECACHE_URLS = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/favicon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

const MAX_IMAGE_ENTRIES = 60;

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // Individually, so one 404 can't fail the whole install.
      await Promise.all(
        PRECACHE_URLS.map((url) =>
          cache.add(new Request(url, { cache: "reload" })).catch(() => {}),
        ),
      );
    })(),
  );
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("medialayer-") && !CURRENT_CACHES.includes(key))
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

// The page asks for this once the user accepts an update.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING" || event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// ── Strategies ───────────────────────────────────────────────────────────────
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  await Promise.all(keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key)));
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone()).then(() => {
          if (maxEntries) trimCache(cacheName, maxEntries);
        });
      }
      return response;
    })
    .catch(() => null);
  return cached || (await network) || Response.error();
}

/** Network-first for HTML: fresh app shell when online, cached shell offline. */
async function handleNavigation(event) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const preloaded = await event.preloadResponse;
    const response = preloaded || (await fetch(event.request));
    if (response && response.ok) cache.put("/", response.clone());
    return response;
  } catch {
    return (
      (await cache.match("/")) ||
      (await cache.match(OFFLINE_URL)) ||
      new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } })
    );
  }
}

// ── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  // Range requests (video scrubbing) must reach the network untouched.
  if (request.headers.has("range")) return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  const sameOrigin = url.origin === self.location.origin;

  // Never cache the API, auth callbacks, or media streams.
  if (
    sameOrigin &&
    (url.pathname.startsWith("/api") ||
      url.pathname.startsWith("/auth") ||
      /\.(mp4|webm|mov|m3u8|mpd)$/i.test(url.pathname))
  ) {
    return;
  }
  if (request.destination === "video" || request.destination === "audio") return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(event));
    return;
  }

  if (sameOrigin) {
    // Vite emits content-hashed files under /assets — safe to cache forever.
    if (url.pathname.startsWith("/assets/")) {
      event.respondWith(cacheFirst(request, ASSET_CACHE));
      return;
    }
    if (request.destination === "image") {
      event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE, MAX_IMAGE_ENTRIES));
      return;
    }
    if (
      request.destination === "script" ||
      request.destination === "style" ||
      request.destination === "font" ||
      request.destination === "manifest"
    ) {
      event.respondWith(staleWhileRevalidate(request, ASSET_CACHE));
      return;
    }
    return;
  }

  // Google Fonts: stylesheet revalidates, the font files themselves are immutable.
  if (url.hostname === "fonts.googleapis.com") {
    event.respondWith(staleWhileRevalidate(request, FONT_CACHE));
    return;
  }
  if (url.hostname === "fonts.gstatic.com") {
    event.respondWith(cacheFirst(request, FONT_CACHE));
  }
});
