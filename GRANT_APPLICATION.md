# Agentic Engineering Grant — MediaLayer

**Submit at:** https://superteam.fun/earn/grants/agentic-engineering
**Cheque size:** 200 USDG · **Avg response:** ~1 week · **Global eligibility**

---

## Step 1: Basics

**Project Title**
> MediaLayer

**One Line Description**
> An agentic content operations platform where AI agents produce, QA, and prepare video for publishing — with Solana escrow paying editors and on-chain attestations proving who approved what.

**TG username**
> t.me/Bansidev

**Wallet Address**
> 8oBePCwen8fqoPtUsmV52G9fZWFjfMXMQoefL2ubmM6p

---

## Step 2: Details

**Project Details**

> MediaLayer is a video collaboration and publishing platform used by creators, editors, and agencies. Today a creator assigns a video to an editor, the editor uploads a cut, the creator reviews and approves it, and the approved video is published to YouTube. It is live at https://medialayer.vercel.app with a TypeScript monorepo of ~17,000 lines across 180 commits, backed by Postgres/Drizzle, Cloudinary, and an Express API on Render.
>
> Two things break as AI agents start doing the production work. First, **nobody can verify what an agent produced or who signed off on it.** When a transcript, caption, or short-form clip is machine-generated, the approval record that matters — which human accepted which exact file — lives in a mutable database row that the platform itself controls. Agencies already lose disputes over "I never approved that," and platforms are beginning to require AI-generation disclosure. Second, **the freelance video economy has no trustless payment rail.** Editors, disproportionately in India, Nigeria, and the Philippines, deliver work and then wait on a creator's goodwill; cross-border settlement is slow and expensive. MediaLayer already moves editor payments in SOL, but the payment is post-hoc and voluntary — nothing compels a creator to pay after approving.
>
> This grant funds the work that makes both of those solvable at once. On the agent side I am building an orchestrated multi-agent layer — a transcription agent, a quality/safety agent, and a caption-and-repurposing agent — each running as an asynchronous, retryable, cost-tracked task with structured JSON output and a mandatory human review gate before anything publishes. On the Solana side I am adding an Anchor escrow program: when a creator assigns a job, USDC is locked on-chain; the QA agent's verdict plus the human approval unlock release to the editor's wallet, and a timeout refunds the creator. The same transaction carries an attestation signed by the **approver's own wallet** over a hash of the actual media bytes and the agent-run metadata that produced them.
>
> That last detail is the point. MediaLayer already writes SPL Memo approval receipts, but they are signed by the platform's own keypair over a hash of database identifiers — which proves nothing a Postgres row doesn't. Moving the signature to the approver and the hash to the content turns the record into a real, non-repudiable client sign-off, and makes Solana load-bearing rather than decorative: escrow that no party can unilaterally reverse, and attestations that survive the platform itself.

**Deadline**
> 4 September 2026 (Asia/Calcutta)

**Proof of Work**

> **Live product:** https://medialayer.vercel.app — full creator/editor workflow in production. Backend healthy at https://layer-1.onrender.com/api/healthz
>
> **Product walkthrough (YouTube):** https://youtu.be/yByh_eDWNMI
>
> **Demo (Loom):** https://www.loom.com/share/0ed842bce0c441d385ac0ae1080737bb
>
> **Repo:** https://github.com/Vikashpatanvadiya/Medialayer — 180 commits, ~17k lines of TypeScript across a pnpm monorepo (`backend/`, `frontend/`, `lib/db`, `lib/api-zod`, `lib/api-client-react`)
>
> **Solana already shipped and working:**
> - Plan payments in SOL with server-side transaction verification, lamport-delta checks against the platform wallet, 10-minute freshness window, and signature-replay protection — `backend/src/lib/solana.ts`, `backend/src/routes/payments.ts`
> - Creator→editor bounty payments verified on-chain against the editor's registered wallet, with Explorer links surfaced in notifications
> - On-chain approval receipts via SPL Memo, written through a retrying fire-and-forget worker that persists `pending`/`confirmed`/`failed` state — `backend/src/lib/approvalMemo.ts`, `backend/src/lib/recordApprovalReceipt.ts`, `approval_receipts` table
> - Wallet-adapter connection plus manual wallet entry in profile settings
> - Commits: `45e1b50` Solana integration (payment verification, editor payments), `9ce9e99` blockchain-based tx confirmation, `62c8579` devnet tx landing with configurable RPC, `1998ae6` self-transfer detection
>
> **Non-Solana product depth:** Google OAuth + JWT auth with role-based access (creator/editor), Cloudinary video pipeline with signed streaming URLs, versioned review/approve/reject/rollback flow, YouTube OAuth and upload integration, notifications, audit logging, plan limits, helmet/rate-limiting/CORS hardening.
>
> **AI-assisted development:** this entire codebase was built with Claude Code and Codex; session transcripts attached (`claude-session.jsonl`, `codex-session.jsonl`).

**Personal X Profile**
> x.com/vikash_sol

**Personal GitHub Profile**
> github.com/Vikashpatanvadiya

**Colosseum Crowdedness Score**
> <PASTE PUBLIC GOOGLE DRIVE LINK TO SCREENSHOT>
> Get it at https://colosseum.com/copilot — search your project, screenshot the Crowdedness Score, upload to Google Drive, set sharing to "Anyone with the link".

**AI Session Transcript**
> Attach `claude-session.jsonl` (and `codex-session.jsonl`) from the project root.

---

## Step 3: Milestones

**Goals and Milestones**

> **M1 — Agent task framework + transcription agent (Aug 8–14, 2026)**
> Ship the `ai_tasks` table and orchestrator: queued/running/completed/failed states, structured JSON input/output, retry with backoff, prompt versioning, and per-task cost tracking. First agent live — transcription with timestamps and speaker hints, producing editable transcripts and SRT/VTT export. Task status surfaced in the UI with loading, empty, error, and retry states.
>
> **M2 — Anchor escrow program on devnet + USDC migration (Aug 15–21, 2026)**
> Anchor program with `initialize_job`, `release`, `refund`, and `dispute` instructions. Creator locks USDC in a per-job PDA on assignment; release requires the creator's approval signature; timeout refunds the creator. Migrate plan pricing and editor bounties from SOL to USDC to remove volatility. Program tests + devnet deploy, address published in the repo.
>
> **M3 — QA agent gating escrow + approver-signed attestations (Aug 22–28, 2026)**
> Quality/safety agent that checks audio levels, black frames, silence, aspect ratio, missing captions, and brand-voice violations, classifying issues as Critical / Warning / Suggestion. Critical issues block escrow release. Replace platform-signed SPL Memo receipts with attestations signed by the **approver's wallet** over a SHA-256 of the actual media bytes plus the agent-run metadata — making the on-chain record prove content and identity, not just that the server said so.
>
> **M4 — Repurposing agent, end-to-end demo, mainnet-beta (Aug 29–Sep 4, 2026)**
> Caption-and-metadata agent producing platform-specific titles, descriptions, hashtags, and CTAs, plus highlight/short-clip detection with timestamps. Full loop demo: upload → agents process → human reviews → approves with wallet signature → escrow releases USDC to the editor → publish to YouTube. Deploy escrow to mainnet-beta with a documented `.env.example` and published program address.

**Primary KPI**
> Number of escrow-settled editor jobs — jobs where USDC was locked on-chain, passed AI QA, received a wallet-signed human approval, and released to the editor. Target: 25 completed settlements within 30 days of launch.
>
> _This is deliberately one metric that only moves if both halves work: the agent layer has to actually gate quality, and the chain has to actually settle payment. Vanity signups can't inflate it._

**Final tranche checkbox**
> ✅ Acknowledged — to receive the final tranche I must submit: the Colosseum project link, the GitHub repo, and my AI subscription receipt.

---

## Pre-submit checklist

- [x] Telegram, wallet, X handle filled in (wallet validated as on-curve base58)
- [x] Demo links included (YouTube + Loom, both resolving)
- [ ] **Get Colosseum Crowdedness Score screenshot → public Drive link → paste**
- [ ] Attach `claude-session.jsonl` and `codex-session.jsonl`
- [ ] **Confirm https://github.com/Vikashpatanvadiya/Medialayer is public** — reviewers will open it
- [ ] Keep your AI subscription receipt (Claude/Codex) — required for the final tranche
