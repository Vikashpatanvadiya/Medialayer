# Layer — Technical Flow Document

## Overview
Layer is a video collaboration platform between **Editors** and **Creators**.
Editors upload edited videos → Creators review and approve → Creator uploads to YouTube.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React + TypeScript, Vite, TailwindCSS, shadcn/ui, TanStack Query, Wouter (routing) |
| Backend | Node.js + Express 5, TypeScript, built with esbuild → `dist/index.cjs` |
| Database | PostgreSQL on Neon (serverless), ORM: Drizzle |
| File Storage | Cloudinary (video files, persistent) |
| Auth | JWT (stored in `localStorage` as `layer_token`) |
| Deployment | Backend → Render (free tier), Frontend → Vercel |
| Monorepo | pnpm workspaces: `backend/`, `frontend/`, `lib/db`, `lib/api-zod`, `lib/api-client-react` |

---

## Monorepo Structure

```
/
├── backend/src/
│   ├── app.ts              # Express app setup (helmet, compression, rate limiting, CORS)
│   ├── index.ts            # Server entry point
│   ├── routes/
│   │   ├── auth.ts         # POST /api/auth/register, /login, /logout, GET /me
│   │   ├── videos.ts       # CRUD for videos + approve/reject/rollback
│   │   ├── upload.ts       # POST /api/upload/video (multer → Cloudinary)
│   │   ├── stream.ts       # GET /api/stream/:videoId/url (returns signed Cloudinary URL)
│   │   ├── youtube.ts      # YouTube OAuth + upload
│   │   ├── users.ts        # User management (invite codes, editor-creator linking)
│   │   ├── notifications.ts
│   │   └── logs.ts
│   └── lib/
│       ├── auth.ts         # JWT sign/verify, requireAuth middleware, requireRole middleware
│       ├── cloudinary.ts   # upload, getSignedUrl, download, delete
│       ├── youtube.ts      # OAuth2 client, uploadVideoToYouTube
│       └── mailer.ts       # Email notifications (nodemailer)
├── frontend/src/
│   ├── pages/
│   │   ├── auth.tsx                    # Login / Register
│   │   ├── editor/dashboard.tsx        # Editor home
│   │   ├── editor/new-submission.tsx   # Upload modal
│   │   ├── editor/all-submissions.tsx  # All editor videos
│   │   ├── creator/dashboard.tsx       # Creator home (pending review queue)
│   │   ├── creator/all-videos.tsx      # All creator videos
│   │   ├── creator/my-editors.tsx      # Manage linked editors
│   │   └── video-detail.tsx            # Video player + approve/reject/YT upload
│   └── lib/api.ts                      # apiUrl() helper using VITE_API_URL env var
├── lib/
│   ├── db/src/schema/                  # Drizzle schema (users, videos, notifications, editor_creators)
│   ├── api-zod/                        # Zod schemas for request validation
│   └── api-client-react/src/
│       ├── hooks.ts                    # useGetVideo, useListVideos, useApproveVideo, etc.
│       └── types.ts                    # Shared TypeScript types (User, Video, Notification)
```

---

## Database Schema (Neon PostgreSQL)

### `users`
- `id` uuid PK
- `email`, `name`, `passwordHash`, `role` (creator | editor)
- `inviteCode` — creators get a code, editors use it to link
- `youtubeTokens` json — OAuth tokens stored per creator
- `youtubeChannelName`

### `videos`
- `id` uuid PK
- `title`, `description`, `tags` text[]
- `videoUrl` — Cloudinary secure URL (used for YouTube download)
- `storedFilename` — Cloudinary filename (e.g. `1234567890-123.mp4`)
- `thumbnailUrl`
- `status` enum: `pending | approved | rejected | uploaded`
- `creatorId`, `editorId` → FK to users
- `rejectionFeedback`
- `fileSize`, `duration`
- `youtubeVideoId`, `youtubeUrl`

### `editor_creators`
- `editorId`, `creatorId` — many-to-many link table

### `notifications`
- `userId`, `title`, `message`, `type`, `videoId`, `read`

---

## Security

- **JWT auth**: every API request requires `Authorization: Bearer <token>` header
- **Role enforcement**: `requireRole("creator")` / `requireRole("editor")` middleware on routes
- **Ownership checks**: videos routes verify `creatorId` or `editorId` matches JWT user
- **Video access**: raw Cloudinary URLs never exposed in API responses — only `hasFile: boolean`
- **Signed URLs**: `/api/stream/:videoId/url` returns a 1-hour expiring signed Cloudinary URL after auth check
- **Helmet**: security headers on all responses
- **Compression**: gzip on all responses
- **Rate limiting**: 200 req/15min general, 15 req/15min on `/api/auth`
- **CORS**: only `FRONTEND_URL` and localhost allowed

---

## Full User Flow

### 1. Registration & Linking
1. Creator registers → gets an `inviteCode`
2. Editor registers → goes to "My Creators" → enters invite code → linked via `editor_creators` table
3. Editor can now submit videos to that creator

### 2. Video Upload (Editor)
1. Editor opens "New Submission" modal
2. Selects video file (MP4/MOV, up to 2GB)
3. XHR `POST /api/upload/video` with `multipart/form-data`
   - multer saves to local `uploads/` temp dir
   - Backend uploads to Cloudinary (`medialayer/` folder, `resource_type: video`)
   - Local temp file deleted
   - Returns `{ filename, cloudinaryUrl }`
4. Progress bar shows: 0-100% = uploading to server, then "Saving to cloud…" while Cloudinary processes
5. On success, form submits `POST /api/videos` with `{ title, description, tags, videoUrl: cloudinaryUrl, storedFilename: filename, ... }`
6. Video saved to DB with `status: pending`
7. Notification created for creator
8. Email sent to creator

### 3. Video Review (Creator)
1. Creator sees video in "Needs Review" queue on dashboard
2. Clicks video → `GET /api/videos/:id`
3. Frontend calls `GET /api/stream/:videoId/url?token=<jwt>`
   - Backend verifies JWT, checks ownership
   - Returns `{ url: <signed Cloudinary URL, 1hr expiry> }`
4. Frontend sets `<video src>` to signed URL — browser streams directly from Cloudinary CDN
5. Creator watches video, then:
   - **Approve**: `POST /api/videos/:id/approve` → status → `approved`, editor notified
   - **Reject**: `POST /api/videos/:id/reject` with feedback → status → `rejected`, editor notified
   - Both use optimistic updates — UI updates instantly without waiting for server

### 4. Rollback
- Creator can rollback `approved → pending`
- Editor can rollback `rejected → pending` (resubmit)

### 5. YouTube Upload (Creator)
1. Creator connects YouTube: `GET /api/youtube/auth-url` → Google OAuth popup
2. OAuth callback at `GET /api/youtube/oauth-callback` → tokens saved to `users.youtubeTokens`
3. Popup closes → frontend polls `/api/youtube/status` every 1.5s until connected
4. Creator clicks "Upload to YouTube" on an approved video
5. `POST /api/youtube/upload/:videoId` — backend responds **immediately** with `{ status: "uploading" }`
6. Background job runs:
   - Downloads video from Cloudinary using `storedFilename` → local temp file
   - Uploads to YouTube API as **public** video
   - Updates DB: `status: uploaded`, `youtubeVideoId`, `youtubeUrl`
   - Sends notification + email to editor
   - Deletes local temp file
7. Frontend polls `GET /api/videos/:id` every 5s
8. When `youtubeUrl` appears in DB → UI shows "View on YouTube" button

---

## API Routes Summary

| Method | Route | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/api/auth/register` | No | - | Register user |
| POST | `/api/auth/login` | No | - | Login, returns JWT |
| GET | `/api/auth/me` | Yes | - | Current user |
| GET | `/api/videos` | Yes | - | List own videos |
| POST | `/api/videos` | Yes | editor | Submit video |
| GET | `/api/videos/:id` | Yes | - | Get video (ownership check) |
| POST | `/api/videos/:id/approve` | Yes | creator | Approve video |
| POST | `/api/videos/:id/reject` | Yes | creator | Reject with feedback |
| POST | `/api/videos/:id/rollback` | Yes | - | Rollback status |
| DELETE | `/api/videos/:id` | Yes | - | Delete video + Cloudinary file |
| POST | `/api/upload/video` | Yes | editor | Upload video file to Cloudinary |
| GET | `/api/stream/:videoId/url` | Yes | - | Get signed Cloudinary URL |
| GET | `/api/youtube/auth-url` | Yes | creator | Get Google OAuth URL |
| GET | `/api/youtube/oauth-callback` | No | - | OAuth callback, saves tokens |
| GET | `/api/youtube/status` | Yes | creator | Check YouTube connection |
| POST | `/api/youtube/upload/:videoId` | Yes | creator | Start async YouTube upload |
| GET | `/api/users/link` | Yes | editor | Link to creator via invite code |
| GET | `/api/notifications` | Yes | - | List notifications |
| GET | `/api/healthz` | No | - | Health check |

---

## Environment Variables

### Render (Backend)
```
NODE_ENV=production
JWT_SECRET=<strong random string>
DATABASE_URL=<neon postgres connection string>
FRONTEND_URL=https://medialayer.vercel.app
BACKEND_URL=https://layer-1.onrender.com
CLOUDINARY_CLOUD_NAME=dasrs5xx0
CLOUDINARY_API_KEY=<key>
CLOUDINARY_API_SECRET=<secret>
YOUTUBE_CLIENT_ID=<google oauth client id>
YOUTUBE_CLIENT_SECRET=<google oauth client secret>
```

### Vercel (Frontend)
```
VITE_API_URL=https://layer-1.onrender.com
```

---

## Deployment

- **Backend**: Render free tier, auto-deploys from `main` branch
  - Build: `npm install -g pnpm && pnpm install --no-frozen-lockfile && pnpm --filter @workspace/api-server run build`
  - Start: `node backend/dist/index.cjs`
  - Health check: `GET /api/healthz`
- **Frontend**: Vercel, auto-deploys from `main` branch
  - Build: `cd frontend && pnpm install && pnpm run build`
  - Output: `frontend/dist`

---

## Known Limitations (Free Tier)
- Render free tier has **ephemeral filesystem** — local files deleted on restart (solved by Cloudinary)
- Render free tier **spins down after 15min inactivity** — first request after sleep takes ~30s cold start
- YouTube upload is async because Render's 30s request timeout would kill a synchronous upload
- Google OAuth app is unverified — shows warning screen for non-test users
