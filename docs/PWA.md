# PWA

MediaLayer is installable on desktop and mobile and runs in a standalone window
with no browser chrome. There is no PWA build plugin — the pieces are plain
files, so nothing is hidden behind a bundler step.

On a phone it also *presents* as an app rather than a website — see
[Mobile app shell](#mobile-app-shell).

## What's where

| Piece | File |
| --- | --- |
| Manifest (name, icons, shortcuts, screenshots) | `frontend/public/manifest.webmanifest` |
| Service worker (offline shell, runtime caching) | `frontend/public/sw.js` |
| Offline fallback page | `frontend/public/offline.html` |
| Registration, install + update state | `frontend/src/lib/pwa.ts` |
| Install card, update banner, offline pill | `frontend/src/components/pwa/` |
| Meta tags, iOS launch screens | `frontend/index.html` |
| Standalone CSS behaviour | `frontend/src/index.css` (PWA section) |
| Phone vs. website decision | `frontend/src/hooks/use-mobile-app.ts` |
| First-run onboarding | `frontend/src/pages/mobile/onboarding.tsx` |
| Phone shell (app bar + tab bar) | `frontend/src/components/layout/mobile-app-layout.tsx` |
| Icon / launch-screen generator | `frontend/scripts/generate-pwa-assets.mjs` |
| Cache headers for `sw.js` etc. | `vercel.json`, `frontend/vercel.json` |

## Caching strategy

- **Navigations** — network first, falling back to the cached app shell, then
  `offline.html`. A deploy is picked up on the next online navigation.
- **`/assets/*`** — cache first. Vite content-hashes these, so they never go stale.
- **Images** — stale-while-revalidate, capped at 60 entries.
- **Google Fonts** — stylesheet revalidates, font files are cached permanently.
- **`/api/*`, `/auth/*`, video files, range requests** — never touched by the
  service worker. Nothing authenticated or streamed is ever cached.

## Updating the app

A new `sw.js` installs in the background and waits. The page shows a
"New version available" banner; accepting it posts `SKIP_WAITING` and reloads
once the new worker takes over. Bump `SW_VERSION` in `sw.js` when the caching
behaviour itself changes — old caches are dropped on activate.

Because the browser only reinstalls the worker when `sw.js` changes byte-wise,
`sw.js` is served with `Cache-Control: max-age=0, must-revalidate`.

## Regenerating assets

Icons, maskable icons, the apple-touch icon, and the iOS launch screens are
rendered from the logomark with headless Chrome:

```bash
cd frontend && node scripts/generate-pwa-assets.mjs
```

Install-dialog screenshots are captured from a running site (the landing page
animates on scroll, so it needs a real page load) and should be refreshed after
a visual redesign:

```bash
cd frontend && node scripts/generate-pwa-assets.mjs --screenshots https://medialayer.app
```

Check the output before shipping — scroll-triggered animations occasionally get
captured mid-flight. Every screenshot of one `form_factor` must share the same
aspect ratio, and each file needs an entry in the manifest.

## Testing locally

The service worker is only registered in production builds; in dev it actively
unregisters itself so Vite's module graph isn't cached.

```bash
cd frontend && pnpm build && pnpm serve
```

Then in DevTools → Application: check Manifest (installability), Service Workers
(activated), and tick "Offline" and reload — the app shell should still render.

## Mobile app shell

Below 768px — and in the installed app at any size — MediaLayer drops the
marketing site entirely and behaves like a phone app:

- **`/` on first run** shows a four-slide swipeable onboarding
  (`medialayer:onboarded` in localStorage). Its CTAs go to register/sign-in.
- **`/` on later runs** redirects straight to `/login`, the way an app opens on
  its sign-in screen. Signed in, `/` is the role dashboard.
- **Signed in**, `DashboardLayout` swaps the sidebar for `MobileAppLayout`: a
  quiet app bar (logo + account), one scrolling content area, and a five-tab
  bottom bar sized for thumbs. Detail screens (e.g. a video) swap the logo for a
  back chevron and a title.
- **Auth screens** become full-screen app screens instead of centered web cards.

Two deliberate exceptions keep the marketing site reachable:

- **Crawlers and link previewers** (`isCrawler()` in `use-mobile-app.ts`) always
  get the landing page, so mobile-first indexing and social cards are unaffected.
- **`?site=1`** opts a phone into the full website for the rest of the session —
  useful for checking marketing copy on a real device.

Desktop browsers are untouched: `/` is still the landing page and the signed-in
app still uses the sidebar layout.

## Standalone behaviour

`PwaManager` sets `data-standalone` on `<html>` when the app is launched from
the home screen. That drives:

- safe-area padding (`.pwa-safe-top` / `.pwa-safe-bottom` / `.pwa-safe-x`),
- no rubber-band scrolling, no pull-to-refresh, no long-press callouts,
- `.hide-in-app` for web-only affordances,
- external links opened in the browser instead of trapping them in the app window.
