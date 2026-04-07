import { Link } from "wouter";
import { useState } from "react";
import { Upload, Eye, CheckCircle, Youtube, Shield, Lock, Users, ArrowRight, ChevronDown, Check, X, BarChart3 } from "lucide-react";

const P = "var(--purple-4)";
const P1 = "var(--purple-1)";

function Tag({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-widest text-center mb-3" style={{ color: P }}>{children}</p>;
}
function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-3xl md:text-[40px] font-bold text-center text-foreground mb-3" style={{ letterSpacing: "-0.025em" }}>{children}</h2>;
}
function Sub({ children }: { children: React.ReactNode }) {
  return <p className="text-center text-muted-foreground mb-14 max-w-xl mx-auto">{children}</p>;
}

// Feature tabs — like visitors.now Dashboard/Profiles/Funnels/Performance/Realtime
const TABS = [
  { label: "Dashboard",  desc: "See all your videos, pending reviews, and editor activity at a glance." },
  { label: "Review",     desc: "Watch videos securely in-browser with signed URLs. No downloads needed." },
  { label: "Approve",    desc: "One-click approve or reject with feedback. Editor notified instantly." },
  { label: "Publish",    desc: "Push approved videos directly to your YouTube channel." },
  { label: "Realtime",   desc: "See upload activity and notifications as they happen." },
];

function FeatureTabs() {
  const [active, setActive] = useState(0);
  return (
    <div className="mt-8">
      {/* Tab bar */}
      <div className="inline-flex items-center gap-1 px-1.5 py-1.5 rounded-full border border-border bg-muted/50 mb-6">
        {TABS.map((t, i) => (
          <button key={t.label} onClick={() => setActive(i)}
            className="px-4 py-1.5 rounded-full text-xs font-medium transition-all"
            style={i === active
              ? { background: "#fff", color: "var(--fg-4)", boxShadow: "var(--shadow-1)" }
              : { color: "var(--fg-3)" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Mockup with gradient bg — like visitors.now */}
      <div className="relative rounded-t-[var(--radius-6)] overflow-hidden max-w-4xl mx-auto"
        style={{ background: "linear-gradient(160deg, #ede9fe 0%, #c4b5fd 100%)" }}>
        <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: "rgba(255,255,255,0.3)", backdropFilter: "blur(8px)" }}>
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="rounded-[var(--radius-3)] px-3 py-0.5 text-xs text-muted-foreground w-44 text-center"
              style={{ background: "rgba(255,255,255,0.7)" }}>
              medialayer.app/{TABS[active].label.toLowerCase()}
            </div>
          </div>
        </div>
        <div className="aspect-[16/7] flex flex-col items-center justify-center gap-3 px-8">
          <p className="text-sm font-semibold" style={{ color: "#4c1d95" }}>{TABS[active].label}</p>
          <p className="text-xs text-center max-w-sm" style={{ color: "#6d28d9" }}>{TABS[active].desc}</p>
        </div>
      </div>
    </div>
  );
}

// ── FAQ ───────────────────────────────────────────────────────────────────────
const FAQ = [
  { q: "Do I need to share my YouTube password with my editor?", a: "Never. MediaLayer uses OAuth — your editor never sees your credentials. You connect your YouTube channel once, and MediaLayer handles publishing on your behalf." },
  { q: "How does the video review process work?", a: "Your editor uploads the finished video directly to MediaLayer. You get notified, watch it securely in the browser (no download needed), then approve or reject with optional feedback." },
  { q: "Is my video stored securely?", a: "Yes. Videos are stored privately on Cloudinary and are never accessible via a public URL. Playback uses signed URLs that expire after 1 hour." },
  { q: "Can I work with multiple editors?", a: "Yes. The Starter plan supports up to 3 editors. The Pro plan supports unlimited editors." },
  { q: "What happens after I approve a video?", a: "The video is pushed directly to your YouTube channel. Your editor gets notified and can see the YouTube link inside the platform." },
  { q: "Is this a subscription or a one-time payment?", a: "One-time payment. Pay once and use MediaLayer forever — no monthly fees, no hidden charges." },
  { q: "What video formats are supported?", a: "MP4 and MOV files up to 2GB. Cloudinary handles transcoding so your editor can upload in either format." },
  { q: "Can I share my dashboard publicly?", a: "No — dashboards are private by default. Only authenticated creators and their linked editors can access the platform." },
];

// Cell icon for comparison table
function CellIcon({ v }: { v: string }) {
  if (v === "yes") return (
    <svg className="w-5 h-5 mx-auto" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" stroke="var(--purple-3)" strokeWidth="1.5" />
      <path d="M6.5 10l2.5 2.5 4.5-4.5" stroke="var(--purple-4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (v === "partial") return (
    <svg className="w-5 h-5 mx-auto" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" stroke="var(--amber-3)" strokeWidth="1.5" />
      <path d="M7 10h6" stroke="var(--amber-4)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
  return (
    <svg className="w-4 h-4 mx-auto" viewBox="0 0 16 16" fill="none">
      <path d="M4 4l8 8M12 4l-8 8" stroke="var(--gray-3)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-4 text-left gap-4">
        <span className="font-medium text-foreground text-sm">{q}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="text-sm text-muted-foreground leading-relaxed pb-4">{a}</p>}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">

      {/* ── 1. NAV — dark pill, centered, like visitors.now ── */}
      <nav className="fixed top-4 inset-x-0 z-50 flex justify-center px-4">
        <div className="flex items-center gap-0.5 px-1.5 py-1.5 rounded-full"
          style={{ background: "#1a1a2e", boxShadow: "0 2px 24px rgba(0,0,0,0.3)" }}>
          <Link href="/" className="flex items-center justify-center w-7 h-7 rounded-full mr-1"
            style={{ background: "rgba(255,255,255,0.12)" }}>
            <img src="/favicon.svg" alt="MediaLayer" className="w-4 h-4 brightness-0 invert" />
          </Link>
          {[
            { label: "Features",    href: "#features",    route: false },
            { label: "Pricing",     href: "#pricing",     route: false },
            { label: "Blog",        href: "#faq",         route: false },
            { label: "Docs",        href: "#faq",         route: false },
            { label: "Login",       href: "/login",       route: true  },
          ].map((item) =>
            item.route
              ? <Link key={item.label} href={item.href}
                  className="px-3 py-1.5 text-xs font-medium rounded-full transition-colors hover:text-white"
                  style={{ color: "rgba(255,255,255,0.6)" }}>{item.label}</Link>
              : <a key={item.label} href={item.href}
                  className="px-3 py-1.5 text-xs font-medium rounded-full transition-colors hover:text-white"
                  style={{ color: "rgba(255,255,255,0.6)" }}>{item.label}</a>
          )}
          <Link href="/register"
            className="px-4 py-1.5 rounded-full text-white text-xs font-semibold ml-1"
            style={{ background: P }}>
            Register
          </Link>
        </div>
      </nav>

      {/* ── 2. HERO — white bg, centered, feature tabs + gradient mockup ── */}
      <section className="pt-28 pb-0 bg-background">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <a href="#features" className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-6 border transition-colors hover:opacity-80"
            style={{ background: P1, color: P, borderColor: "var(--purple-2)" }}>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: P }}>NEW</span>
            Early Access — Limited Spots
            <ArrowRight className="w-3 h-3" />
          </a>
          <h1 className="text-4xl md:text-[52px] font-bold leading-[1.1] mb-4 text-foreground" style={{ letterSpacing: "-0.03em" }}>
            Video-first collaboration<br />for creators & editors
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mb-8 max-w-lg mx-auto leading-relaxed">
            Your editor uploads. You review securely. One click publishes to YouTube. No downloads, no shared passwords.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
            <Link href="/register"
              className="px-6 py-2.5 rounded-full text-white text-sm font-semibold"
              style={{ background: P, boxShadow: "0 4px 20px rgba(145,141,246,0.35)" }}>
              Start 14 day free trial
            </Link>
            <a href="#features"
              className="px-6 py-2.5 rounded-full text-sm font-medium border border-border text-foreground hover:bg-muted transition-colors">
              See demo
            </a>
          </div>
          <FeatureTabs />
        </div>
      </section>

      {/* ── 4. FEATURES ── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <Tag>Features</Tag>
          <H2>Everything you need to<br />manage your video workflow</H2>
          <Sub>From secure uploads to direct YouTube publishing — MediaLayer handles the entire creator-editor pipeline.</Sub>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            {/* Card 1 — Secure Upload */}
            <div className="rounded-[var(--radius-6)] p-6 flex flex-col" style={{ background: "var(--bg-2)", boxShadow: "var(--shadow-2)" }}>
              <div className="w-8 h-8 rounded-[var(--radius-4)] flex items-center justify-center mb-3" style={{ background: "var(--green-1)" }}>
                <Upload className="w-4 h-4" style={{ color: "var(--green-4)" }} />
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--green-4)" }}>Secure upload</p>
              <p className="text-xl font-bold text-foreground leading-snug mb-4" style={{ letterSpacing: "-0.02em" }}>
                Your editor uploads directly.<br />No file sharing needed.
              </p>
              <ul className="space-y-1.5 mb-4">
                {["No Google Drive or WeTransfer", "Up to 2GB per video", "Private Cloudinary storage"].map(b => (
                  <li key={b} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--green-4)" }} /> {b}
                  </li>
                ))}
              </ul>
              <a href="#how-it-works" className="text-xs font-medium flex items-center gap-1 mb-5" style={{ color: "var(--green-4)" }}>
                Learn more <ArrowRight className="w-3 h-3" />
              </a>
              <div className="rounded-[var(--radius-4)] border border-border overflow-hidden mt-auto" style={{ background: "var(--bg-1)", border: "1px solid var(--gray-2)" }}>
                {[["MP4", 1243, 1243], ["MOV", 412, 1243], ["AVI", 87, 1243], ["MKV", 34, 1243]].map(([fmt, count, max]) => (
                  <div key={String(fmt)} className="flex items-center justify-between px-4 py-2.5 border-b border-border last:border-0">
                    <span className="text-xs text-muted-foreground">{fmt}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-4)" }}>
                        <div className="h-full rounded-full" style={{ width: `${(Number(count) / Number(max)) * 100}%`, background: "var(--green-3)" }} />
                      </div>
                      <span className="text-xs font-medium text-foreground w-10 text-right">{count.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 2 — In-browser review */}
            <div className="rounded-[var(--radius-6)] p-6 flex flex-col" style={{ background: "var(--bg-2)", boxShadow: "var(--shadow-2)" }}>
              <div className="w-8 h-8 rounded-[var(--radius-4)] flex items-center justify-center mb-3" style={{ background: "var(--sky-1)" }}>
                <Eye className="w-4 h-4" style={{ color: "var(--sky-4)" }} />
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--sky-4)" }}>In-browser review</p>
              <p className="text-xl font-bold text-foreground leading-snug mb-4" style={{ letterSpacing: "-0.02em" }}>
                Watch videos securely<br />as they happen.
              </p>
              <ul className="space-y-1.5 mb-4">
                {["Signed URLs — no public links", "1-hour expiry for security", "No downloads ever needed"].map(b => (
                  <li key={b} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--sky-4)" }} /> {b}
                  </li>
                ))}
              </ul>
              <a href="#how-it-works" className="text-xs font-medium flex items-center gap-1 mb-5" style={{ color: "var(--sky-4)" }}>
                Learn more <ArrowRight className="w-3 h-3" />
              </a>
              <div className="rounded-[var(--radius-4)] border border-border overflow-hidden mt-auto" style={{ background: "var(--bg-1)", border: "1px solid var(--gray-2)" }}>
                {[
                  { name: "Product Launch v3", editor: "Jordan K.", time: "now", status: "pending" },
                  { name: "Tutorial Series Ep.4", editor: "Alex R.", time: "2m", status: "approved" },
                  { name: "Brand Story Cut", editor: "Sam L.", time: "5m", status: "pending" },
                  { name: "Q4 Campaign Final", editor: "Jordan K.", time: "12m", status: "approved" },
                ].map((v) => (
                  <div key={v.name} className="flex items-center justify-between px-4 py-2.5 border-b border-border last:border-0">
                    <div>
                      <p className="text-xs font-medium text-foreground">{v.name}</p>
                      <p className="text-[10px] text-muted-foreground">{v.editor}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={v.status === "approved"
                          ? { background: "var(--green-1)", color: "var(--green-4)" }
                          : { background: "var(--amber-1)", color: "var(--amber-4)" }}>
                        {v.status}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{v.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 3 — Approval flow */}
            <div className="rounded-[var(--radius-6)] p-6 flex flex-col" style={{ background: "var(--bg-2)", boxShadow: "var(--shadow-2)" }}>
              <div className="w-8 h-8 rounded-[var(--radius-4)] flex items-center justify-center mb-3" style={{ background: P1 }}>
                <CheckCircle className="w-4 h-4" style={{ color: P }} />
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: P }}>Approval flow</p>
              <p className="text-xl font-bold text-foreground leading-snug mb-4" style={{ letterSpacing: "-0.02em" }}>
                See the complete journey<br />of every video submission.
              </p>
              <ul className="space-y-1.5 mb-4">
                {["Full submission history", "Rejection feedback loop", "Instant editor notifications"].map(b => (
                  <li key={b} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="w-3.5 h-3.5 shrink-0" style={{ color: P }} /> {b}
                  </li>
                ))}
              </ul>
              <a href="#how-it-works" className="text-xs font-medium flex items-center gap-1 mb-5" style={{ color: P }}>
                Learn more <ArrowRight className="w-3 h-3" />
              </a>
              <div className="rounded-[var(--radius-4)] border border-border mt-auto flex flex-col items-center justify-center py-8" style={{ background: "var(--bg-1)", border: "1px solid var(--gray-2)" }}>
                <div className="w-20 h-20 rounded-full border-4 flex items-center justify-center mb-2" style={{ borderColor: "var(--green-3)" }}>
                  <span className="text-2xl font-bold text-foreground">98%</span>
                </div>
                <p className="text-sm font-semibold text-foreground">Approval rate</p>
                <p className="text-xs text-muted-foreground mt-1 text-center max-w-[160px]">Most videos get approved on the first review.</p>
                <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "var(--red-4)" }} /> Rejected</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "var(--amber-3)" }} /> Pending</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "var(--green-3)" }} /> Approved</span>
                </div>
              </div>
            </div>

            {/* Card 4 — YouTube publish */}
            <div className="rounded-[var(--radius-6)] p-6 flex flex-col" style={{ background: "var(--bg-2)", boxShadow: "var(--shadow-2)" }}>
              <div className="w-8 h-8 rounded-[var(--radius-4)] flex items-center justify-center mb-3" style={{ background: "var(--red-1)" }}>
                <Youtube className="w-4 h-4" style={{ color: "var(--red-4)" }} />
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--red-4)" }}>YouTube publishing</p>
              <p className="text-xl font-bold text-foreground leading-snug mb-4" style={{ letterSpacing: "-0.02em" }}>
                See how your videos perform<br />after publishing.
              </p>
              <ul className="space-y-1.5 mb-4">
                {["Direct YouTube OAuth", "No re-uploading ever", "Per-video publish tracking"].map(b => (
                  <li key={b} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--red-4)" }} /> {b}
                  </li>
                ))}
              </ul>
              <a href="#how-it-works" className="text-xs font-medium flex items-center gap-1 mb-5" style={{ color: "var(--red-4)" }}>
                Learn more <ArrowRight className="w-3 h-3" />
              </a>
              <div className="rounded-[var(--radius-4)] border border-border overflow-hidden mt-auto" style={{ background: "var(--bg-1)", border: "1px solid var(--gray-2)" }}>
                {[
                  { label: "Published this month", value: "24" },
                  { label: "Avg. time to publish", value: "4 min" },
                  { label: "Total videos", value: "142" },
                  { label: "YouTube connected", value: "✓ Active" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between px-4 py-2.5 border-b border-border last:border-0">
                    <span className="text-xs text-muted-foreground">{s.label}</span>
                    <span className="text-xs font-semibold text-foreground">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom row — 2 smaller cards */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-[var(--radius-5)] p-5 flex items-start gap-4" style={{ background: "var(--bg-2)", boxShadow: "var(--shadow-2)" }}>
              <div className="w-8 h-8 rounded-[var(--radius-4)] flex items-center justify-center shrink-0" style={{ background: "var(--green-1)" }}>
                <Shield className="w-4 h-4" style={{ color: "var(--green-4)" }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Privacy-first</p>
                <p className="text-xs text-muted-foreground leading-relaxed">No shared passwords. OAuth-based login. AES-256 encrypted tokens. Signed URLs that expire in 1 hour.</p>
              </div>
            </div>
            <div className="rounded-[var(--radius-5)] p-5 flex items-start gap-4" style={{ background: "var(--bg-2)", boxShadow: "var(--shadow-2)" }}>
              <div className="w-8 h-8 rounded-[var(--radius-4)] flex items-center justify-center shrink-0" style={{ background: "var(--amber-1)" }}>
                <Users className="w-4 h-4" style={{ color: "var(--amber-4)" }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Role-based access</p>
                <p className="text-xs text-muted-foreground leading-relaxed">Separate dashboards for creators and editors. Connect via invite code. Everyone sees only what they need.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 px-6 bg-background">
        <div className="max-w-4xl mx-auto">
          <Tag>How it works</Tag>
          <H2>Get started in minutes</H2>
          <Sub>Setting things up is as simple as inviting your editor and connecting YouTube. No complex setup or confusing configuration.</Sub>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="rounded-[var(--radius-6)] overflow-hidden" style={{ background: "var(--bg-2)", boxShadow: "var(--shadow-2)" }}>
              {/* Visual — blobs + white circle icon */}
              <div className="h-52 flex items-center justify-center relative overflow-hidden">
                <div className="absolute w-24 h-24 rounded-full blur-2xl opacity-70" style={{ background: "var(--red-3)", left: "8%", top: "20%" }} />
                <div className="absolute w-24 h-24 rounded-full blur-2xl opacity-50" style={{ background: "var(--sky-3)", right: "5%", top: "20%" }} />
                {/* White circle with dark inner circle — exactly like ref */}
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center z-10 shadow-md">
                  <div className="w-12 h-12 rounded-full bg-[#111] flex items-center justify-center">
                    <img src="/favicon.svg" alt="MediaLayer" className="w-6 h-6 brightness-0 invert" />
                  </div>
                </div>
              </div>
              {/* Text — centered */}
              <div className="px-6 pb-8 text-center">
                <div className="inline-flex items-center justify-center px-3 py-1 rounded-full mb-4 text-sm font-semibold"
                  style={{ background: "var(--purple-1)", color: P }}>01</div>
                <p className="text-base text-foreground leading-relaxed">
                  <span className="font-bold">Invite your editor.</span>{" "}
                  <span style={{ color: "var(--fg-3)" }}>Share an invite code. Your editor links to your account instantly.</span>
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="rounded-[var(--radius-6)] overflow-hidden" style={{ background: "var(--bg-2)", boxShadow: "var(--shadow-2)" }}>
              <div className="h-52 flex items-center justify-center relative overflow-hidden">
                <div className="absolute w-24 h-24 rounded-full blur-2xl opacity-40" style={{ background: "var(--purple-3)", left: "10%", top: "15%" }} />
                <div className="absolute w-24 h-24 rounded-full blur-2xl opacity-40" style={{ background: "var(--green-3)", right: "10%", top: "15%" }} />
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center z-10 shadow-md">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "var(--purple-3)" }}>
                    <Upload className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
              <div className="px-6 pb-8 text-center">
                <div className="inline-flex items-center justify-center px-3 py-1 rounded-full mb-4 text-sm font-semibold"
                  style={{ background: "var(--purple-1)", color: P }}>02</div>
                <p className="text-base text-foreground leading-relaxed">
                  <span className="font-bold">Editor uploads.</span>{" "}
                  <span style={{ color: "var(--fg-3)" }}>Your editor uploads the finished video directly. No file sharing needed.</span>
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="rounded-[var(--radius-6)] overflow-hidden" style={{ background: "var(--bg-2)", boxShadow: "var(--shadow-2)" }}>
              <div className="h-52 flex flex-col justify-center px-5 gap-2">
                {[
                  { label: "Direct",  value: "$4,230", color: "var(--green-4)" },
                  { label: "Google",  value: "$2,150", color: "var(--green-4)" },
                  { label: "Twitter", value: "$980",   color: "var(--green-4)" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between px-3 py-2 rounded-[var(--radius-4)]"
                    style={{ background: "var(--bg-1)", border: "1px solid var(--gray-2)" }}>
                    <span className="text-xs text-foreground font-medium">{row.label}</span>
                    <span className="text-xs font-semibold" style={{ color: row.color }}>{row.value}</span>
                  </div>
                ))}
              </div>
              <div className="px-6 pb-8 text-center">
                <div className="inline-flex items-center justify-center px-3 py-1 rounded-full mb-4 text-sm font-semibold"
                  style={{ background: "var(--purple-1)", color: P }}>03</div>
                <p className="text-base text-foreground leading-relaxed">
                  <span className="font-bold">Review & publish.</span>{" "}
                  <span style={{ color: "var(--fg-3)" }}>Approve or reject with feedback. One click publishes to YouTube.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. COMPARISON ── */}
      <section id="comparison" className="py-24 px-6 bg-background">
        <div className="max-w-4xl mx-auto">
          <Tag>Comparison</Tag>
          <H2>How MediaLayer compares</H2>
          <Sub>See how MediaLayer stacks up against the most popular video collaboration tools on the market.</Sub>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="text-left pb-4 font-normal w-2/5" />
                  {/* MediaLayer — pill column header */}
                  <th className="pb-0 px-3 text-center w-[15%] align-bottom">
                    <div className="inline-flex rounded-t-[20px] pt-4 pb-3 px-2 flex-col items-center gap-2"
                      style={{ border: "1.5px solid var(--purple-3)", borderBottom: "none", background: "var(--purple-1)" }}>
                      <div className="w-10 h-10 rounded-full bg-[#111] flex items-center justify-center">
                        <img src="/favicon.svg" alt="MediaLayer" className="w-5 h-5 brightness-0 invert" />
                      </div>
                      <span className="text-xs font-medium" style={{ color: "var(--fg-3)" }}>MediaLayer</span>
                    </div>
                  </th>
                  {[
                    { label: "Google Drive", bg: "#f0f0f0", text: "🗂" },
                    { label: "WeTransfer",   bg: "#e8f4fd", text: "📦" },
                    { label: "Email",        bg: "#f5f0ff", text: "📧" },
                  ].map((col) => (
                    <th key={col.label} className="pb-4 px-3 text-center w-[15%]">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-[var(--radius-4)] flex items-center justify-center text-lg"
                          style={{ background: col.bg }}>{col.text}</div>
                        <span className="text-xs font-medium" style={{ color: "var(--fg-3)" }}>{col.label}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {([
                  ["GDPR compliant",             "yes", "partial", "no",  "no"],
                  ["No file size limits",        "yes", "no",      "no",  "no"],
                  ["Secure video review",        "yes", "no",      "no",  "no"],
                  ["One-click YouTube publish",  "yes", "no",      "no",  "no"],
                  ["Role-based access",          "yes", "no",      "no",  "no"],
                  ["Feedback & approval flow",   "yes", "no",      "no",  "no"],
                  ["No shared passwords",        "yes", "no",      "no",  "no"],
                  ["Audit trail",                "yes", "no",      "no",  "no"],
                  ["Direct YouTube publishing",  "yes", "no",      "no",  "no"],
                ] as [string, string, string, string, string][]).map(([label, ml, drive, wt, email], i, arr) => (
                  <tr key={label} style={{ borderTop: "1px solid var(--gray-2)" }}>
                    <td className="py-3.5 pr-4 text-sm text-foreground">{label}</td>
                    {/* MediaLayer cell — inside pill */}
                    <td className="py-3.5 px-3 text-center"
                      style={{
                        background: "var(--purple-1)",
                        borderLeft: "1.5px solid var(--purple-3)",
                        borderRight: "1.5px solid var(--purple-3)",
                        ...(i === arr.length - 1 ? {
                          borderBottom: "1.5px solid var(--purple-3)",
                          borderRadius: "0 0 20px 20px",
                        } : {}),
                      }}>
                      <CellIcon v={ml} />
                    </td>
                    {[drive, wt, email].map((v, j) => (
                      <td key={j} className="py-3.5 px-3 text-center">
                        <CellIcon v={v} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── 7. PRICING ── */}
      <section id="pricing" className="py-24 px-6" style={{ background: "var(--bg-1)", border: "1px solid var(--gray-2)" }}>
        <div className="max-w-3xl mx-auto">
          <Tag>Pricing</Tag>
          <H2>Simplified pricing</H2>
          <Sub>No confusing tiers. Pay once and get lifetime access — everything included.</Sub>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-card rounded-[var(--radius-6)] border border-border p-7 flex flex-col" style={{ boxShadow: "var(--shadow-2)" }}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Starter</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-bold text-foreground" style={{ letterSpacing: "-0.03em" }}>$50</span>
                <span className="text-muted-foreground text-sm mb-1.5">one-time</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">Perfect for solo creators working with one editor.</p>
              <ul className="space-y-2.5 mb-8 flex-1 text-sm">
                {["1 creator account", "Up to 3 editors", "Unlimited video reviews", "Direct YouTube publishing", "Email notifications", "Lifetime access"].map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-foreground">
                    <Check className="w-4 h-4 shrink-0" style={{ color: "var(--green-4)" }} /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/checkout?plan=starter" className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors">
                Get started <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="rounded-[var(--radius-6)] p-7 flex flex-col relative overflow-hidden"
              style={{ background: P, boxShadow: "0 8px 32px rgba(145,141,246,0.35)" }}>
              <span className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}>Most popular</span>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.6)" }}>Pro</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-bold text-white" style={{ letterSpacing: "-0.03em" }}>$100</span>
                <span className="text-sm mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>one-time</span>
              </div>
              <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.7)" }}>For growing channels with multiple editors.</p>
              <ul className="space-y-2.5 mb-8 flex-1 text-sm">
                {["Unlimited creator accounts", "Unlimited editors", "Unlimited video reviews", "Direct YouTube publishing", "Priority email support", "Audit logs & analytics", "Lifetime access"].map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-white">
                    <Check className="w-4 h-4 shrink-0" style={{ color: "rgba(255,255,255,0.7)" }} /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/checkout?plan=pro" className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white text-sm font-semibold hover:bg-white/90 transition-colors"
                style={{ color: P }}>
                Get started <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-5">No subscriptions · No hidden fees · Pay once, own it forever</p>
        </div>
      </section>

      {/* ── 8. FAQ ── */}
      <section id="faq" className="py-24 px-6">
        <div className="max-w-2xl mx-auto">
          <Tag>FAQ</Tag>
          <H2>Frequently asked questions</H2>
          <Sub>Quick answers to common questions about pricing, privacy, setup, and more.</Sub>
          <div className="rounded-[var(--radius-6)] border border-border bg-card px-6" style={{ boxShadow: "var(--shadow-1)" }}>
            {FAQ.map((item) => <FaqItem key={item.q} {...item} />)}
          </div>
        </div>
      </section>

      {/* ── 9. FINAL CTA ── */}
      <section className="py-24 px-6" style={{ background: "linear-gradient(160deg, #ede9fe 0%, #ddd6fe 60%, #c4b5fd 100%)" }}>
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "#1e1b4b", letterSpacing: "-0.025em" }}>
            See what's driving your video workflow
          </h2>
          <p className="mb-8 text-sm leading-relaxed" style={{ color: "#4c1d95" }}>
            Start reviewing and publishing videos today. No downloads, no shared passwords.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register"
              className="px-7 py-3 rounded-full text-white text-sm font-semibold"
              style={{ background: P, boxShadow: "0 4px 20px rgba(145,141,246,0.4)" }}>
              Start 14 day free trial
            </Link>
            <a href="#features"
              className="px-7 py-3 rounded-full text-sm font-medium"
              style={{ background: "rgba(255,255,255,0.6)", color: "#4c1d95", border: "1px solid rgba(145,141,246,0.3)" }}>
              See demo
            </a>
          </div>
        </div>
      </section>

      {/* ── 10. FOOTER ── */}
      <footer className="bg-[#111] text-white pt-14 pb-10 px-6 relative overflow-hidden">
        {/* Circular watermark */}
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full opacity-5 translate-x-1/3 translate-y-1/3"
          style={{ background: P }} />

        <div className="max-w-5xl mx-auto relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 pb-12 border-b border-white/10">
            <div>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4">Product</p>
              <ul className="space-y-2.5 text-sm text-white/60">
                <li><Link href="/login" className="hover:text-white transition-colors">Login</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Register</Link></li>
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4">Features</p>
              <ul className="space-y-2.5 text-sm text-white/60">
                <li><span>Secure Upload</span></li>
                <li><span>Video Review</span></li>
                <li><span>YouTube Publish</span></li>
                <li><span>Audit Trail</span></li>
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4">Comparison</p>
              <ul className="space-y-2.5 text-sm text-white/60">
                <li><span>vs Google Drive</span></li>
                <li><span>vs WeTransfer</span></li>
                <li><span>vs Email</span></li>
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4">Company</p>
              <ul className="space-y-2.5 text-sm text-white/60">
                <li><a href="mailto:hello@medialayer.app" className="hover:text-white transition-colors">Contact</a></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8">
            <div className="flex items-center gap-2">
              <img src="/favicon.svg" alt="MediaLayer" className="w-5 h-5 opacity-80" />
              <span className="font-semibold text-sm">MediaLayer</span>
              <span className="text-white/30 text-sm ml-1">© 2026</span>
            </div>
            <p className="text-xs text-white/30">Built for creators who value their time.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
