# MediaLayer — Hardening Guide
## Reliability · Security · Plans · Observability

> This document covers what is already implemented, what gaps exist, and the concrete steps to harden each area for production.

---

## 1. Audit Trail & Logging

### What exists

The platform has a `logs` table in PostgreSQL and a `logAction()` helper in `backend/src/lib/logger.ts`.

```ts
// lib/logger.ts
export async function logAction(userId, action, videoId?, meta?) { ... }
```

Actions currently logged:
| Action | Triggered by |
|---|---|
| `upload_started` | `POST /api/upload/video` (before multer) |
| `upload_completed` | `POST /api/upload/video` (after Cloudinary) |
| `submitted_for_review` | `POST /api/videos` |
| `approved` | `POST /api/videos/:id/approve` |
| `rejected` | `POST /api/videos/:id/reject` |
| `rollback_approved_to_pending` | `POST /api/videos/:id/rollback` (creator) |
| `rollback_rejected_to_pending` | `POST /api/videos/:id/rollback` (editor) |

Logs are viewable via `GET /api/logs` (creator-only, last 100 entries).

### Gaps

- YouTube upload events (`yt_upload_started`, `yt_upload_success`, `yt_upload_failed`) are not logged — only `console.log`
- Auth events (login, register, Google OAuth, failed login) are not logged
- Video deletion is not logged
- Logs endpoint only returns 100 rows with no pagination or filtering
- No log retention policy

### Recommended additions

**Log YouTube upload lifecycle** — in `backend/src/routes/youtube.ts`:
```ts
await logAction(req.user!.userId, "yt_upload_started", videoId);
// ... in background job on success:
await logAction(video.creatorId, "yt_upload_success", videoId_, { youtubeUrl: result.youtubeUrl });
// ... on failure:
await logAction(video.creatorId, "yt_upload_failed", videoId_, { error: err?.message });
```

**Log auth events** — in `backend/src/routes/auth.ts`:
```ts
// on successful login:
await logAction(user.id, "login", undefined, { method: "email" });
// on failed login (use a system/anonymous log or just console.warn):
console.warn("[auth] Failed login attempt for:", email);
```

**Log video deletion** — in `backend/src/routes/videos.ts` DELETE handler:
```ts
await logAction(user.userId, "video_deleted", id, { title: video.title });
```

**Add pagination to logs endpoint** — in `backend/src/routes/logs.ts`:
```ts
const limit = Math.min(Number(req.query.limit) || 50, 200);
const offset = Number(req.query.offset) || 0;
// add .limit(limit).offset(offset) to the query
```

---

## 2. Alerts

### What exists

- Email notifications are sent to editors/creators on video state changes (submitted, approved, rejected, uploaded)
- Templates live in `backend/src/lib/mailer.ts`
- Brevo HTTP API is the primary provider; Resend is the fallback

### Gaps

- No operational alerts (e.g., YouTube upload failure doesn't notify the creator)
- No admin/ops alerting channel (Slack, PagerDuty, etc.)
- No alert when Cloudinary upload fails
- No alert when email delivery fails

### Recommended additions

**Alert creator on YouTube upload failure** — in the background job in `youtube.ts`:
```ts
// on catch block, after DB update:
const tpl = {
  subject: `YouTube upload failed for "${video.title}"`,
  html: `<p>The upload of <b>"${video.title}"</b> to YouTube failed.</p>
         <p><b>Reason:</b> ${err?.message}</p>
         <p>Please try again from your dashboard.</p>`,
};
const [creator] = await db.select().from(usersTable).where(eq(usersTable.id, video.creatorId)).limit(1);
if (creator?.email) await sendEmail(creator.email, tpl.subject, tpl.html);
```

**Ops alerting via webhook** — add a lightweight helper:
```ts
// backend/src/lib/alert.ts
export async function alertOps(message: string, data?: object) {
  const webhookUrl = process.env.OPS_WEBHOOK_URL;
  if (!webhookUrl) return;
  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: message, data }),
  }).catch(() => {}); // non-blocking
}
```

Set `OPS_WEBHOOK_URL` to a Slack incoming webhook or similar. Call `alertOps()` on critical failures (YouTube upload fail, Cloudinary upload fail, DB errors).

---

## 3. Token & Personal Data Protection

### What exists

| Data | Protection |
|---|---|
| Passwords | bcryptjs, cost factor 10 |
| JWT tokens | HS256, 7-day expiry, `JWT_SECRET` env var |
| YouTube OAuth tokens | AES-256-CBC encrypted in DB using `JWT_SECRET`-derived key |
| Cloudinary video URLs | Never exposed in API responses; only `hasFile: boolean` returned |
| Signed video URLs | 1-hour expiry, generated server-side after auth check |
| Email verification tokens | 32-byte random hex, single-use, cleared after use |

### Gaps

- `JWT_SECRET` is used both for JWT signing and as the AES encryption key source — if it rotates, all YouTube tokens become unreadable
- JWT stored in `localStorage` (XSS-accessible); `httpOnly` cookie would be safer
- No token revocation mechanism (logout is client-side only)
- `backend/.env` contains real credentials — must never be committed to git (verify `.gitignore`)
- Google OAuth callback passes JWT token in URL query string (`/auth/google/success?token=...`) — visible in browser history and server logs

### Recommendations

**Separate encryption key from JWT secret** — add a dedicated env var:
```
ENCRYPTION_KEY=<32-byte random hex string>
```
Update `backend/src/lib/crypto.ts` to use `ENCRYPTION_KEY` instead of deriving from `JWT_SECRET`.

**Protect the Google OAuth token in URL** — in `auth-google.ts`, use a short-lived one-time code instead of the JWT directly:
```ts
// Store token in a temp map with 60s TTL, redirect with a code
// Frontend exchanges code for token via POST /api/auth/exchange-code
```
This prevents the JWT from appearing in browser history.

**Verify `.gitignore` covers secrets**:
```
backend/.env
.env
.env.local
.env.*.local
```

**Data handling documentation** — see Section 8 below.

---

## 4. Failed-Upload Recovery

### What exists

- Multer saves to local `uploads/` temp dir, then uploads to Cloudinary
- On Cloudinary failure, local temp file is deleted and a 500 error is returned
- YouTube upload retries 3 times with exponential backoff (2s, 4s, 6s)
- YouTube upload failure sets `youtubeUrl` to `error:<message>` in DB
- Frontend polls `GET /api/videos/:id` every 5s to detect YouTube upload completion

### Gaps

- If Cloudinary upload fails mid-stream, the editor sees a generic 500 with no retry UI
- If the server restarts during a Cloudinary upload, the local temp file is lost (Render ephemeral FS)
- YouTube upload failure is stored as `youtubeUrl: "error:..."` — no dedicated `uploadError` field
- No retry button in the UI for failed YouTube uploads
- No Cloudinary upload progress feedback beyond "Saving to cloud…"

### Recommendations

**Add a dedicated `uploadError` field to videos** — or use a separate status like `upload_failed`:
```sql
-- migration
ALTER TABLE videos ADD COLUMN youtube_upload_error text;
```
Update `youtube.ts` to set this field on failure instead of polluting `youtubeUrl`.

**Frontend retry button** — in `video-detail.tsx`, detect `youtubeUrl?.startsWith("error:")` and show a "Retry YouTube Upload" button that calls `POST /api/youtube/upload/:videoId` again.

**Cloudinary upload retry** — in `backend/src/lib/cloudinary.ts`:
```ts
export async function uploadToCloudinary(filePath, filename, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await cloudinary.uploader.upload(filePath, { ... });
    } catch (err) {
      if (i === retries) throw err;
      await new Promise(r => setTimeout(r, 2000 * (i + 1)));
    }
  }
}
```

**Resumable uploads for large files** — for files >500MB, consider Cloudinary's chunked upload API (`upload_large`) to survive network interruptions.

---

## 5. Status Page

### What exists

- `GET /api/healthz` returns `{ status: "ok" }` — no auth required
- Frontend pings this every 14 minutes to prevent Render cold starts

### Gaps

- Health check doesn't verify DB connectivity or Cloudinary reachability
- No public-facing status page
- No uptime monitoring

### Recommendations

**Enhance the health check** — in `backend/src/routes/health.ts`:
```ts
router.get("/healthz", async (_req, res) => {
  const checks: Record<string, "ok" | "error"> = { api: "ok" };
  
  // DB check
  try {
    await db.execute(sql`SELECT 1`);
    checks.db = "ok";
  } catch {
    checks.db = "error";
  }

  const allOk = Object.values(checks).every(v => v === "ok");
  res.status(allOk ? 200 : 503).json({ status: allOk ? "ok" : "degraded", checks });
});
```

**Public status page options:**
- [Instatus](https://instatus.com) — free tier, connect to `/api/healthz`
- [UptimeRobot](https://uptimerobot.com) — free, monitors `/api/healthz` every 5 minutes, sends email/Slack alerts on downtime
- [Render's built-in health checks](https://render.com/docs/health-checks) — already configured via `startCommand`

**Recommended UptimeRobot setup:**
1. Create a free account at uptimerobot.com
2. Add monitor: HTTP(s), URL = `https://layer-1.onrender.com/api/healthz`
3. Check interval: 5 minutes
4. Alert contacts: email + Slack webhook

---

## 6. Plan Gating (Feature Tiers)

### What exists

No subscription or plan system exists. All features are available to all registered users.

### Proposed Tier Structure

Based on the platform's pricing model, here is a recommended tier structure:

| Feature | Free | Pro (Creator) | Team (Creator) |
|---|---|---|---|
| Videos submitted per month | 3 | 20 | Unlimited |
| Linked editors | 1 | 5 | Unlimited |
| YouTube auto-upload | ❌ | ✅ | ✅ |
| Audit log access | ❌ | ✅ | ✅ |
| Priority support | ❌ | ❌ | ✅ |

### Implementation Plan

**Step 1 — Add plan field to users table:**
```ts
// lib/db/src/schema/users.ts
plan: text("plan", { enum: ["free", "pro", "team"] }).notNull().default("free"),
planExpiresAt: timestamp("plan_expires_at"),
```

**Step 2 — Plan enforcement middleware:**
```ts
// backend/src/lib/plan.ts
export function requirePlan(minPlan: "pro" | "team") {
  return async (req: Request, res: Response, next: NextFunction) => {
    const [user] = await db.select({ plan: usersTable.plan })
      .from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
    const tiers = ["free", "pro", "team"];
    if (tiers.indexOf(user?.plan ?? "free") < tiers.indexOf(minPlan)) {
      res.status(403).json({ error: "Upgrade your plan to access this feature." });
      return;
    }
    next();
  };
}
```

**Step 3 — Gate YouTube upload behind Pro:**
```ts
// routes/youtube.ts
router.post("/upload/:videoId", requireAuth, requireRole("creator"), requirePlan("pro"), async (req, res) => { ... });
```

**Step 4 — Gate video submission count for editors:**
```ts
// routes/videos.ts POST /
const thisMonth = new Date(); thisMonth.setDate(1); thisMonth.setHours(0,0,0,0);
const [{ count }] = await db.select({ count: sql<number>`count(*)` })
  .from(videosTable)
  .where(and(eq(videosTable.editorId, req.user!.userId), gte(videosTable.createdAt, thisMonth)));
if (editorPlan === "free" && count >= 3) {
  res.status(403).json({ error: "Free plan limit: 3 submissions per month. Upgrade to submit more." });
  return;
}
```

### Payment Flow (Stripe)

**Recommended integration:**

1. Install Stripe: `pnpm add stripe @stripe/stripe-js`
2. Add env vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID`, `STRIPE_TEAM_PRICE_ID`
3. Create checkout session endpoint:
```ts
// POST /api/billing/checkout
router.post("/checkout", requireAuth, requireRole("creator"), async (req, res) => {
  const { priceId } = req.body;
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: req.user!.email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.FRONTEND_URL}/dashboard/creator?upgraded=1`,
    cancel_url: `${process.env.FRONTEND_URL}/pricing`,
    metadata: { userId: req.user!.userId },
  });
  res.json({ url: session.url });
});
```
4. Handle Stripe webhook to update `users.plan`:
```ts
// POST /api/billing/webhook (raw body, no JSON middleware)
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const event = stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"]!, process.env.STRIPE_WEBHOOK_SECRET!);
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan || "pro"; // set in checkout metadata
    await db.update(usersTable).set({ plan }).where(eq(usersTable.id, userId));
  }
  res.json({ received: true });
});
```

---

## 7. Environment Variables Reference

### Backend (Render)

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | ✅ | `production` |
| `PORT` | ✅ | Server port (Render sets this automatically) |
| `JWT_SECRET` | ✅ | Strong random string (min 32 chars). Used for JWT signing. |
| `ENCRYPTION_KEY` | ✅ (recommended) | Separate 32-byte hex key for AES encryption of OAuth tokens |
| `DATABASE_URL` | ✅ | Neon PostgreSQL connection string |
| `FRONTEND_URL` | ✅ | e.g. `https://medialayer.vercel.app` |
| `BACKEND_URL` | ✅ | e.g. `https://layer-1.onrender.com` |
| `CLOUDINARY_CLOUD_NAME` | ✅ | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | ✅ | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | ✅ | Cloudinary API secret |
| `YOUTUBE_CLIENT_ID` | ✅ | Google OAuth client ID |
| `YOUTUBE_CLIENT_SECRET` | ✅ | Google OAuth client secret |
| `GOOGLE_CLIENT_ID` | optional | Falls back to `YOUTUBE_CLIENT_ID` for Google login |
| `GOOGLE_CLIENT_SECRET` | optional | Falls back to `YOUTUBE_CLIENT_SECRET` for Google login |
| `BREVO_API_KEY` | recommended | Brevo (Sendinblue) HTTP API key for email |
| `RESEND_API_KEY` | optional | Resend API key (fallback email provider) |
| `SMTP_FROM` | recommended | Sender address, e.g. `MediaLayer <noreply@medialayer.app>` |
| `EMAIL_VERIFY_API_KEY` | optional | EasyEmailAPI key for disposable email detection |
| `OPS_WEBHOOK_URL` | recommended | Slack/Discord webhook for operational alerts |
| `STRIPE_SECRET_KEY` | future | Stripe secret key for billing |
| `STRIPE_WEBHOOK_SECRET` | future | Stripe webhook signing secret |

### Frontend (Vercel)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | ✅ | Backend URL, e.g. `https://layer-1.onrender.com` |

### Security checklist for env vars

- [ ] `JWT_SECRET` is at least 32 random characters (not `local-dev-secret-change-in-production`)
- [ ] `backend/.env` is in `.gitignore` and never committed
- [ ] Cloudinary API secret is rotated if ever exposed
- [ ] YouTube/Google OAuth credentials are restricted to the correct redirect URIs in Google Cloud Console
- [ ] Render env vars are set via the Render dashboard, not in `render.yaml`

---

## 8. Data Handling & Privacy

### Data collected

| Data | Where stored | Retention |
|---|---|---|
| Email address | `users.email` (PostgreSQL) | Until account deletion |
| Full name | `users.name` (PostgreSQL) | Until account deletion |
| Password hash | `users.passwordHash` (bcrypt) | Until account deletion |
| Email verification token | `users.verificationToken` | Cleared after verification |
| YouTube OAuth tokens | `users.youtubeTokens` (AES-256-CBC encrypted) | Until disconnected or account deleted |
| YouTube channel name | `users.youtubeChannelName` | Until disconnected |
| Video files | Cloudinary (`medialayer/` folder, `authenticated` type) | Until video deleted |
| Video metadata | `videos` table | Until video deleted |
| Audit logs | `logs` table | No automatic expiry (recommend 90-day retention) |
| Notifications | `notifications` table | No automatic expiry (recommend 30-day retention) |
| IP addresses | Express rate limiter (in-memory, not persisted) | Not stored |

### Data access controls

- Users can only access their own videos, notifications, and logs
- Cloudinary videos are `authenticated` type — direct URL access is blocked without a valid signed URL
- Signed URLs expire after 1 hour
- Raw Cloudinary URLs are never returned in API responses
- YouTube tokens are encrypted at rest

### Third-party data sharing

| Service | Data shared | Purpose |
|---|---|---|
| Neon (PostgreSQL) | All user and video metadata | Database hosting |
| Cloudinary | Video files, thumbnail images | Video storage and CDN |
| Google / YouTube | OAuth tokens, video content | YouTube upload |
| Brevo / Resend | Email address, name | Transactional email |
| Render | Server logs (may include email in log lines) | Backend hosting |
| Vercel | Frontend assets only | Frontend hosting |

### Recommended retention policies

Add a scheduled job (cron) to clean up old data:
```ts
// Run daily — delete logs older than 90 days
await db.delete(logsTable).where(lt(logsTable.createdAt, ninetyDaysAgo));

// Delete read notifications older than 30 days
await db.delete(notificationsTable)
  .where(and(eq(notificationsTable.read, true), lt(notificationsTable.createdAt, thirtyDaysAgo)));
```

On Render, use a [Cron Job service](https://render.com/docs/cronjobs) pointing to a dedicated endpoint.

---

## 9. Security Hardening Checklist

### Already implemented ✅

- [x] Helmet security headers on all responses
- [x] CORS restricted to `FRONTEND_URL` and known Vercel preview domains
- [x] Rate limiting: 200 req/15min general, 50 req/15min on `/api/auth`
- [x] JWT authentication on all protected routes
- [x] Role-based access control (`requireRole`)
- [x] Ownership checks on all video/user operations
- [x] Passwords hashed with bcrypt (cost 10)
- [x] Email verification before login
- [x] YouTube tokens encrypted at rest (AES-256-CBC)
- [x] Signed Cloudinary URLs (1-hour expiry)
- [x] Raw Cloudinary URLs never exposed in API responses
- [x] Multer file type validation (MP4/MOV only)
- [x] Multer file size limit (2GB)
- [x] Zod schema validation on all request bodies
- [x] Unhandled rejection/exception handlers prevent server crashes
- [x] `trust proxy` set for correct IP detection behind Render's proxy

### Recommended additions ⚠️

- [ ] Separate `ENCRYPTION_KEY` from `JWT_SECRET`
- [ ] Remove JWT from Google OAuth redirect URL (use one-time code exchange)
- [ ] Add `Strict-Transport-Security` header (Helmet enables this in production)
- [ ] Add `Content-Security-Policy` header tuned for the app
- [ ] Log failed login attempts (for anomaly detection)
- [ ] Add account lockout after N failed login attempts
- [ ] Validate `creatorId` in video submission is a UUID (prevent injection)
- [ ] Add request ID header (`X-Request-ID`) for log correlation
- [ ] Rotate `JWT_SECRET` periodically (requires re-login for all users)

---

## 10. Reliability Checklist

### Already implemented ✅

- [x] YouTube upload retries (3 attempts, exponential backoff)
- [x] YouTube upload is async (avoids Render 30s timeout)
- [x] Cloudinary storage (survives Render ephemeral FS restarts)
- [x] Frontend keep-alive ping every 14 minutes (prevents cold starts)
- [x] Non-blocking email sends (errors don't crash requests)
- [x] Non-blocking audit log writes (errors don't crash requests)
- [x] Global unhandled rejection/exception handlers

### Recommended additions ⚠️

- [ ] Enhanced health check (DB + Cloudinary connectivity)
- [ ] Uptime monitoring (UptimeRobot or similar)
- [ ] Alert creator on YouTube upload failure via email
- [ ] Cloudinary upload retry logic
- [ ] Retry button in UI for failed YouTube uploads
- [ ] Separate `youtube_upload_error` field in videos table
- [ ] Log retention cron job
- [ ] Database connection pooling tuning for Neon serverless

---

## 11. Quick-Start: What to Do First

Priority order for hardening this platform:

1. **Rotate secrets** — change `JWT_SECRET` from `local-dev-secret-change-in-production` to a strong random value in Render dashboard
2. **Add `ENCRYPTION_KEY`** — separate the AES key from JWT secret
3. **Alert on YouTube upload failure** — email the creator when background upload fails
4. **Enhance health check** — add DB connectivity check to `/api/healthz`
5. **Set up UptimeRobot** — free uptime monitoring on `/api/healthz`
6. **Log YouTube upload events** — add `yt_upload_started/success/failed` to audit trail
7. **Add `OPS_WEBHOOK_URL`** — Slack webhook for critical failures
8. **Add plan field to users** — groundwork for billing (even if all users start on `free`)
9. **Integrate Stripe** — checkout + webhook for plan upgrades
10. **Add log retention cron** — clean up old logs and notifications
