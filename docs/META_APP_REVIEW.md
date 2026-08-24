# Meta App Review — going live with Instagram publishing

Everything needed to move the Meta app (App ID `2131701764445282`, display name
`Connect`) out of Development mode so any creator — not just app testers — can
connect Instagram and publish.

Companion doc: [INSTAGRAM_PUBLISHING.md](./INSTAGRAM_PUBLISHING.md) for how the
integration actually works.

---

## 0. Prerequisites

| Thing | Status | Notes |
| --- | --- | --- |
| Privacy policy covering Instagram | ✅ `/privacy` | Section 4 is the Meta-specific one |
| Terms of Service | ✅ `/terms` | Section 5 is the Instagram one |
| Data deletion instructions | ✅ `/data-deletion` | Required — placeholder URL will fail review |
| App icon, 1024×1024 PNG | ⬜ **you must make this** | No alpha/transparency, no rounded corners |
| Screencast of the full flow | ⬜ **you must record this** | See §3 |
| Business verification | ⬜ **blocker for Advanced Access** | See §4 |

---

## 1. Basic Settings — exact values

Meta dashboard → **App settings → Basic**.

| Field | What to enter |
| --- | --- |
| **Display name** | `MediaLayer` — done. Note this is *not* what the Instagram consent screen shows; see the Instagram app name below. |
| **Namespace** | Leave blank. Only used for legacy Facebook Canvas apps. |
| **App domains** | `medialayer.app` — nothing else. No `https://`, no path, no trailing slash. |
| **Contact email** | `medialayer.app@gmail.com` — use the address you actually monitor. Meta emails review decisions and policy warnings here; a missed mail can get the app disabled. |
| **Privacy policy URL** | `https://medialayer.app/privacy` |
| **Terms of Service URL** | `https://medialayer.app/terms` — currently `https://www.facebook.com/`, which will be rejected. |
| **User data deletion** | Keep the dropdown on **Data deletion instructions URL**, and set it to `https://medialayer.app/data-deletion` — currently `https://www.facebook.com/`, which will be rejected. |
| **App icon** | 1024×1024 PNG, no transparency. Export the MediaLayer logomark on a solid background. |
| **Category** | **Business and pages** — closest fit for a creator-workflow tool. (`Productivity` is the acceptable second choice; do not pick `Entertainment`.) |

### The Instagram app name is separate — sync it

**Use cases → Manage messaging & content on Instagram → Customize → API setup
with Instagram login** has its own identity block:

| Field | Value |
| --- | --- |
| Instagram app name | `Connect-IG` → click **Sync app name** to pull `MediaLayer` |
| Instagram app ID | `2237652773690690` — this is what `INSTAGRAM_CLIENT_ID` must be set to, *not* the Meta App ID `2131701764445282` |

The consent screen a creator sees reads from the **Instagram app name**, not the
Meta app display name. It was auto-derived from the app's original name
(`Connect`) when the use case was added, so renaming the Meta app left it stale.
Reviewers compare that screen against the product name, privacy policy and
screencast — a dialog saying "Connect-IG" is a rejection risk. One click fixes it.

Do **not** press **Add all required permissions** on that page. Meta's "required"
set for this use case includes `instagram_business_manage_comments` and
`instagram_business_manage_messages`, neither of which MediaLayer uses.

### Data Protection Officer section
Optional unless you are established in the EU or systematically monitor EU users
at scale. Leave every field blank. Filling in a partial address is worse than
leaving it empty — Meta validates the block as a whole.

### After saving
Add an **App platform** at the bottom → **Website** → Site URL
`https://medialayer.app`.

> ⚠️ `www.medialayer.app` does not currently resolve. Meta occasionally probes the
> `www` variant when verifying a domain. Add a `www` → apex redirect in Vercel
> before submitting.

---

## 2. Permissions to request

Under **App Review → Permissions and Features**, request Advanced Access for
exactly these two — nothing more:

| Permission | Justification to write in the form |
| --- | --- |
| `instagram_business_basic` | *MediaLayer is a video collaboration tool for content creators and their editors. After a creator connects their Instagram Professional account, we use `instagram_business_basic` to read the account's ID, username, account type and profile picture. The username and profile picture are displayed in the publishing UI so the creator can confirm which account a video is about to be posted to before they publish. The account ID is required to call the content publishing endpoints. We do not read media, comments, insights or followers.* |
| `instagram_business_content_publish` | *Creators use MediaLayer to review video work submitted by their editors. Once a creator approves a video, they choose a destination and caption, then click Publish. We use `instagram_business_content_publish` to create a media container from the approved video and publish it as a Reel or feed post to the creator's own Instagram Professional account. Publishing is always initiated by an explicit click from the account owner inside our app — there is no automated, scheduled-without-consent, or bulk posting.* |

Do **not** request `instagram_business_manage_comments`,
`instagram_business_manage_messages`, or any insights permission. Every extra
permission adds a separate review and a separate reason to be rejected.

### The Permissions and features page is a catalog, not your app's config

Most of the ~30 rows on that page are **not attached to your app**. A row showing
`—` under API Calls with an **Add to App Review** button is a menu item you have
never used. There is nothing to remove — leaving it alone is the correct action.

Only rows with an **Actions** dropdown are actually live on the app:

| Permission | Status | Action |
| --- | --- | --- |
| `instagram_business_basic` | in use | keep — submit for Advanced Access |
| `instagram_business_content_publish` | in use | keep — submit for Advanced Access |
| `instagram_manage_comments` | unused, 0 calls | remove via **Actions**, or simply never submit it |
| `public_profile` | auto-granted to every Meta app | not removable, ignore |

What determines the scope of your review is which permissions you click **Add to
App Review** on — not what the catalog displays.

---

## 2b. Why only tester accounts can connect right now

The app is Published, but "Published" is not the same as public. Until App Review
grants **Advanced Access**, both permissions sit at **Standard Access**, which
only works for Instagram accounts holding a role on the app.

That is why `b1_clicks` connects and publishes normally while other accounts fail
at the token exchange. It is not a bug, and no code change fixes it.

To test with another account before review, add it at **App roles → Roles →
Instagram Testers**, then accept the invite on instagram.com as that account under
**Settings and privacy → Apps and websites → Tester invites**. Both steps.

Advanced Access, granted at the end of App Review, is what removes the
restriction for everyone else.

## 3. The screencast

This is where most submissions fail. Meta needs to watch a reviewer-comprehensible
recording of the **entire** flow, in English, with no cuts.

Record one continuous take, 2–4 minutes, showing:

1. Landing on `https://medialayer.app` and logging in as a creator.
2. Navigating to **Dashboard → Profile → Integrations**.
3. Clicking **Connect Instagram**.
4. The Instagram authorization screen — **the permission list must be legible on
   screen**. Pause here for 3 full seconds.
5. Approving, and landing back on the profile page with the account connected.
6. Opening an approved video.
7. Choosing Reel or feed post, typing a caption, clicking **Publish**.
8. The status moving from pending to published.
9. **Opening the resulting post on instagram.com** to prove it published.
10. Returning to the app and clicking **Disconnect**, showing the account is gone.

Add on-screen captions or a voiceover naming each permission as it is used —
reviewers explicitly look for "which permission does this step need".

Step 9 and step 10 are the two most commonly omitted, and the two most commonly
cited in rejections.

---

## 4. Business verification — plan for this

Advanced Access for `instagram_business_content_publish` requires **Business
Verification** in the Meta Business Manager. This is the longest pole and needs
real documents:

- A legal business entity name and address
- One of: certificate of incorporation, business licence, GST registration,
  business bank statement, or utility bill in the business name
- A phone number or business email on the same domain for the confirmation code

If MediaLayer is not yet a registered entity, this is a genuine blocker on going
public — start the registration before submitting for review, because Meta will
not grant Advanced Access without it. Verification typically takes 2–10 business
days once documents are submitted; App Review itself is usually 3–7 business days
after that, and a rejection restarts the clock.

---

## 5. Pre-submission checklist

- [x] Display name changed from `Connect` to `MediaLayer`
- [ ] Instagram app name synced from `Connect-IG` to `MediaLayer`
- [ ] App domains set to `medialayer.app`
- [ ] Privacy policy, ToS and data deletion URLs all point at `medialayer.app`, all load publicly without a login
- [ ] `www.medialayer.app` redirects to the apex domain
- [ ] 1024×1024 app icon uploaded
- [ ] Category selected
- [ ] Website platform added
- [ ] `INSTAGRAM_REDIRECT_URI` on Render points at the production backend over HTTPS and matches the Meta dashboard entry character for character
- [ ] Production connect + publish + disconnect tested end to end as an app tester
- [ ] Screencast recorded and uploaded
- [ ] Business verification submitted
- [ ] Both permissions requested with the justifications above

---

## 6. After approval

Flip the app from **Development** to **Live** with the toggle at the top of the
dashboard. Nothing in the code changes — the Instagram tester allowlist simply
stops applying, and any creator with a Professional account can connect.

Keep an eye on **App Dashboard → Alerts**: Meta sends breaking-change and policy
notices there, and unaddressed ones can silently downgrade the app's access.
