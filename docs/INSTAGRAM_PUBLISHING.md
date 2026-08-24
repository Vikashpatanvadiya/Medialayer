# Instagram publishing

MediaLayer publishes approved videos to Instagram as **Reels** or **feed posts**
using the **Instagram API with Instagram Login** (Instagram Business Login).

The creator signs in on instagram.com and authorizes MediaLayer directly. There
is **no Facebook Login, no Facebook Page, and no Page access token** anywhere in
this flow.

```
MediaLayer → Connect Instagram → Instagram login → authorize
          → account connected → publish from an approved video
```

## Requirements

- An Instagram **Professional** account (Business or Creator).
- A Meta app with **Use cases → Instagram → API setup with Instagram login**.
- An **HTTPS** redirect URI. Instagram rejects `http://`, including localhost,
  so local development needs a tunnel (ngrok, Cloudflare Tunnel, …).

## Environment variables

| Variable | Purpose |
| --- | --- |
| `INSTAGRAM_CLIENT_ID` | Instagram App ID (Meta dashboard → Instagram → API setup) |
| `INSTAGRAM_CLIENT_SECRET` | Instagram App Secret |
| `INSTAGRAM_REDIRECT_URI` | Must exactly match the Meta dashboard entry |
| `FRONTEND_URL` | Where the callback sends the creator back to |
| `INSTAGRAM_RETURN_PATH` | Optional; defaults to `/dashboard/profile` |

Local (`backend/.env`):

```
INSTAGRAM_CLIENT_ID=<instagram app id>
INSTAGRAM_CLIENT_SECRET=<instagram app secret>
INSTAGRAM_REDIRECT_URI=https://<your-tunnel>.ngrok-free.app/api/integrations/instagram/callback
FRONTEND_URL=http://localhost:5173
```

Production (Render → service → Environment; `.env` is not deployed):

```
INSTAGRAM_CLIENT_ID=<instagram app id>
INSTAGRAM_CLIENT_SECRET=<instagram app secret>
INSTAGRAM_REDIRECT_URI=https://<your-backend-host>/api/integrations/instagram/callback
FRONTEND_URL=https://medialayer.app
```

`INSTAGRAM_APP_ID` / `INSTAGRAM_APP_SECRET` are accepted as aliases.
`META_APP_ID` / `META_APP_SECRET` are **not** used: those are the Facebook app's
credentials, which Instagram Login rejects. The Instagram App ID and Secret come
from the Instagram product page and are different numbers from the Facebook App ID.

Watch the startup log to confirm which values won — `.env` silently keeps the
**last** definition of a duplicated key:

```
[instagram] Ready. Redirect URI: https://abc123.ngrok-free.app/api/integrations/instagram/callback
[instagram] ⚠️  Redirect URI is invalid: …
[instagram] Not configured — set INSTAGRAM_CLIENT_ID and INSTAGRAM_CLIENT_SECRET…
```

The redirect URI is validated at connect time: a non-HTTPS URL, a duplicated
scheme (`https://https://…`), or a wrong path fails fast with a clear message
instead of an opaque Instagram error page.

## Meta dashboard settings

In **Instagram → API setup with Instagram login**:

| Setting | Value |
| --- | --- |
| OAuth Redirect URI | the exact `INSTAGRAM_REDIRECT_URI` value |
| Permissions | `instagram_business_basic`, `instagram_business_content_publish` |

### Instagram testers (development mode)

While the app is in Development mode, only accounts with a role on the app can
authorize it. Both steps are required:

1. **App roles → Roles → Instagram Testers → Add people** → the Instagram username.
2. On instagram.com as that account: **Settings and privacy → Apps and websites →
   Tester invites → Accept**.

Skipping step 2 produces this on Instagram's own error page, before the callback
is ever reached:

```
instagram.com/oauth/authorize/third_party/error/?message=Insufficient developer role
```

The same error appears if the browser is logged into a different Instagram
account than the invited one, or if the account is personal rather than
Professional. MediaLayer cannot detect or report these — Instagram stops the
flow on its side and never redirects back.

## Scopes

Only two, both required for connect-and-publish:

- `instagram_business_basic` — account id, username, account type, profile picture
- `instagram_business_content_publish` — create and publish media

Comment, message, and insights permissions are deliberately not requested.

## OAuth flow

1. `GET /api/integrations/instagram/connect` (creator, Bearer auth) generates a
   32-byte random `state`, stores it in `instagram_oauth_states` with the user id
   and a 10-minute expiry, and returns the Instagram authorize URL. The frontend
   navigates to it. (`?redirect=1` returns a 302 instead.)
2. The creator logs into Instagram and authorizes MediaLayer.
3. `GET /api/integrations/instagram/callback` consumes the `state` — a single
   `UPDATE … WHERE used_at IS NULL` makes replay impossible — and recovers the
   user id from the database, never from the request.
4. The code is exchanged at `api.instagram.com/oauth/access_token`, upgraded to a
   60-day long-lived token, and the profile is read from `graph.instagram.com`.
5. The token is encrypted (`backend/src/lib/crypto.ts`) and stored on
   `instagram_accounts`; the creator is redirected to
   `FRONTEND_URL/dashboard/profile?instagram=connected&username=…`.

Failures redirect with `?instagram=error&reason=…` (`cancelled`, `denied`,
`missing_code`, `invalid_state`, `exchange_failed`), which the UI turns into a
human-readable message. Tokens, codes and secrets are never logged.

## Publishing flow

```
approved video → Cloudinary signed HTTPS URL
              → POST /{ig-user-id}/media          (container)
              → poll status_code until FINISHED    (Instagram transcodes)
              → POST /{ig-user-id}/media_publish   (publish)
              → permalink stored on instagram_posts
```

Endpoints:

- `POST /api/integrations/instagram/publish` — `{ instagramAccountId, postType, caption, videoId? | mediaUrl?, coverUrl? }`
- `POST /api/videos/:id/publish/instagram` — same core, video-scoped (used by the video page)
- `GET /api/videos/:id/instagram-posts` — publish history; readable by the creator **and** the editor

Both return `202` immediately and move the `instagram_posts` row from `PENDING`
to `PUBLISHED` or `FAILED` in the background; the UI polls while anything is
pending. `REELS` posts to Reels only; `FEED` sets `share_to_feed`, which also
places it on the profile grid (Meta retired standalone feed video posts).

Media comes from the existing Cloudinary integration as a signed HTTPS URL —
Instagram downloads it server-side. Nothing is uploaded from the browser.

## Security

- Access tokens are encrypted at rest and never returned to the frontend; the
  accounts endpoint exposes only id, username, account type and timestamps.
- Every publish and disconnect re-checks `instagram_accounts.user_id` against the
  authenticated user, so changing an id in the URL cannot touch another user's
  account.
- `state` is single-use, expiring, and bound to the user server-side.
- Connect, publish and disconnect are `requireRole("creator")`; editors can read
  publish status only.

## Testing

```bash
pnpm --filter @workspace/api-server test:instagram
```

Runs the full flow against a stub Instagram API — authorize URL, code exchange,
long-lived token, refresh, profile, container/poll/publish, error translation —
and asserts that no `graph.facebook.com` endpoint is ever called.

## App Review

Development mode covers the app's own testers. Publishing on behalf of other
creators needs Advanced Access for `instagram_business_basic` and
`instagram_business_content_publish`, which requires App Review — screencast of
the flow, a privacy policy URL, and business verification. Nothing in the code
changes for that.

See [META_APP_REVIEW.md](./META_APP_REVIEW.md) for the exact dashboard field
values, permission justifications, screencast script and submission checklist.
