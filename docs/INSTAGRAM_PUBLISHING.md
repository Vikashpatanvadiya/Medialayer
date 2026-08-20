# Instagram publishing

Creators can publish an **approved** video to Instagram as a **Reel** or a **feed
post**, alongside the existing YouTube flow. Editors see publish status but can
never connect an account or publish.

## 1. Meta app setup

At <https://developers.facebook.com/> create an app (type: **Business**) and add
both products:

- **Instagram** → Instagram API setup with Facebook Login
- **Facebook Login**

Configure:

| Setting | Value |
| --- | --- |
| Valid OAuth Redirect URIs | `https://layer-1.onrender.com/api/integrations/instagram/callback` |
| | `http://localhost:3000/api/integrations/instagram/callback` (dev) |
| App domains | `layer-1.onrender.com` |
| Site URL | `https://medialayer.app` |

**The callback must point at the backend host, not `medialayer.app`.** The Vercel
config rewrites every path to `index.html`, so `https://medialayer.app/api/...`
serves the React app rather than the API and the OAuth callback would land on a
blank page. `layer-1.onrender.com` is the API origin (it's what `VITE_API_URL`
points to in the deployed frontend).

Each URI must match `INSTAGRAM_REDIRECT_URI` **character for character**,
including the trailing path. Meta permits `http://localhost` for development;
any other host must be HTTPS.

### Permissions requested

`instagram_basic`, `instagram_content_publish`, `pages_show_list`,
`pages_read_engagement` — the minimum needed to list a creator's Pages, find the
linked Instagram account, and publish to it. While the app is in development
mode these work for users with a role on the app (admin/developer/tester); going
live requires App Review for `instagram_content_publish`.

### Account requirements

The creator's Instagram account must be **Business** or **Creator** (not
personal) and must be linked to a Facebook Page they administer. Otherwise the
connect flow ends with "No Instagram Business or Creator account was found."

## 2. Server configuration

Local development — `backend/.env`:

```
META_APP_ID=<app id>
META_APP_SECRET=<app secret>
INSTAGRAM_REDIRECT_URI=http://localhost:3000/api/integrations/instagram/callback
FRONTEND_URL=http://localhost:5173
```

Production — set the same keys in the Render service's **Environment** tab
(`.env` is not deployed), with:

```
INSTAGRAM_REDIRECT_URI=https://layer-1.onrender.com/api/integrations/instagram/callback
FRONTEND_URL=https://medialayer.app
```

`FRONTEND_URL` is what the OAuth popup posts its result back to; if it is wrong
the popup still closes and the UI recovers on the next poll, but the connection
won't appear instantly.

Restart the backend after adding these. Until they are set, the API returns 503
with a clear message and the UI shows "Instagram publishing isn't configured on
this server yet." Verify with:

```bash
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/integrations/instagram/accounts
```

`{"configured":true,"accounts":[]}` means the server is ready to connect accounts.

## 3. Database

Tables `instagram_accounts` and `instagram_posts` — see
`lib/db/drizzle/0003_instagram.sql` (already applied to the current database).

Access tokens are stored **encrypted at rest** with the same AES-256-CBC helper
used for YouTube tokens (`backend/src/lib/crypto.ts`, keyed off `JWT_SECRET`),
and are never returned to the client.

## 4. Flow

**Connecting** (`Settings → Integrations`, creators only)

1. `GET /api/integrations/instagram/connect` returns the Facebook OAuth URL. The
   `state` is a JWT signed with `JWT_SECRET`, valid 10 minutes, so a callback
   can't be replayed or forged.
2. The creator approves in a popup; Meta redirects to
   `GET /api/integrations/instagram/callback`.
3. The server exchanges the code, upgrades to a long-lived token, then walks
   `/me/accounts` to find every Page with a linked Instagram account and stores
   the **Page access token** for each (these don't expire while the user keeps
   the permission).
4. The popup posts the result back to the app and closes.

**Publishing** (video detail page, approved videos only)

`POST /api/videos/:id/publish/instagram` with
`{ instagramAccountId, postType: "REELS" | "FEED", caption, coverUrl? }`.

The endpoint validates ownership and approval, writes a `PENDING` row, and
returns `202` immediately. In the background it:

1. builds a signed Cloudinary URL for the video file,
2. creates a media container,
3. polls the container until Instagram finishes ingesting it (up to 8 minutes),
4. publishes the container and fetches the permalink,
5. marks the row `PUBLISHED`, writes a `published_to_instagram` log entry, and
   notifies the editor.

Any failure marks the row `FAILED` with a readable message and logs
`instagram_publish_failed`. The UI polls `GET /api/videos/:id/instagram-posts`
every 5s while a publish is pending.

### Reel vs. feed post

Both use a `REELS` container. Meta retired standalone feed video posts
(`media_type=VIDEO`), so `share_to_feed` is what decides placement:

| UI choice | Container | `share_to_feed` |
| --- | --- | --- |
| Reel | `REELS` | `false` |
| Feed post | `REELS` | `true` |

## 5. Limits and errors

Instagram allows **25 published posts per rolling 24 hours** per account. Reels
must be MP4/MOV, 3–900 seconds, up to 1GB, aspect ratio between 0.01:1 and 10:1.

Graph errors are translated in `backend/src/lib/instagram.ts`:

| Condition | What the creator sees |
| --- | --- |
| Token expired/revoked (code 190) | "Instagram connection expired. Please reconnect…" |
| Rate limited (4, 17, 32, 613) | "Instagram rate limit reached. Please try again later." |
| Publishing limit (9007) | "Instagram publishing limit reached (25 posts per 24 hours)." |
| Bad format (2207026) | The format rules above |
| Media fetch failed (2207020/3) | "Instagram could not download the video file…" |

Server-side failures are logged with video and user context via `logAction`.

## 6. Testing without Instagram

The Graph client can be pointed at a stub server with `META_GRAPH_BASE`, which
is what the bundled test does — container creation, status polling, publish,
permalink, and every error translation:

```bash
cd backend && pnpm test:instagram
```

## 7. Not included in this phase

Scheduling, analytics ingestion, multi-account fan-out in one click, carousels,
image-only posts, stories, and any AI or brand-collaboration features.
