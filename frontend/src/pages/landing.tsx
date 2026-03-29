import { Link } from "wouter";
import {
  ArrowRight, Upload, Eye, CheckCircle, Youtube,
  Shield, Lock, Key, Video, Users, FileCheck, BarChart3,
} from "lucide-react";

// ── CSS vars (from design-brief-loom-landing.md) ─────────────────────────────
// --color-accent: #4f46e5
// --color-accent-hover: #4338ca
// --color-accent-light: #eef2ff
// --shadow-card: 0 4px 24px rgba(0,0,0,0.06)
// --shadow-mockup: 0 8px 40px rgba(0,0,0,0.12)

const ACCENT = "#4f46e5";

// ── Logo marquee data ─────────────────────────────────────────────────────────
const logos = [
  "YouTube Creators", "Indie Filmmakers", "Podcast Studios",
  "Marketing Agencies", "Content Teams", "Video Editors",
  "Course Creators", "Brand Studios",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans antialiased" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── NAV ── brief: fixed, white, subtle border, pill CTA */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <img src="/images/logo.png" alt="MediaLayer" className="h-10 w-auto object-contain" />
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
            <a href="#how-it-works" className="hover:text-gray-900 transition-colors">How it works</a>
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#security" className="hover:text-gray-900 transition-colors">Security</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors hidden sm:block">
              Sign in
            </Link>
            {/* brief: pill-shaped primary CTA */}
            <Link href="/register" className="px-5 py-2 rounded-full text-white text-sm font-semibold transition-colors" style={{ backgroundColor: ACCENT }}>
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── brief: 56–64px H1, dual CTA, generous padding */}
      <section className="pt-36 pb-28 px-6">
        <div className="max-w-[1200px] mx-auto text-center">
          {/* Section label chip */}
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-8" style={{ backgroundColor: "#eef2ff", color: ACCENT }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: ACCENT }} />
            Early Access — Limited Spots
          </span>

          <h1 className="text-5xl md:text-[62px] font-bold tracking-tight text-gray-900 leading-[1.1] mb-6 max-w-4xl mx-auto">
            Your editor uploads.<br />
            <span style={{ color: ACCENT }}>You approve.</span> It publishes.
          </h1>

          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            MediaLayer helps creators review and publish videos without downloads, re-uploads, or sharing YouTube access.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="flex items-center gap-2 px-7 py-3.5 rounded-full text-white font-semibold transition-colors text-sm" style={{ backgroundColor: ACCENT }}>
              Get started free <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#demo" className="flex items-center gap-2 px-7 py-3.5 rounded-full border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors text-sm">
              Watch demo
            </a>
          </div>
        </div>
      </section>

      {/* ── LOGO MARQUEE ── brief: infinite scroll, grayscale logos */}
      <section className="py-12 bg-[#F7F7F8] border-y border-gray-100 overflow-hidden">
        <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest mb-8">
          Trusted by creators and teams worldwide
        </p>
        <div className="flex gap-12 animate-marquee whitespace-nowrap">
          {[...logos, ...logos].map((name, i) => (
            <span key={i} className="text-sm font-semibold text-gray-300 shrink-0 px-4">
              {name}
            </span>
          ))}
        </div>
        <style>{`
          @keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
          .animate-marquee { animation: marquee 20s linear infinite; }
        `}</style>
      </section>

      {/* ── PROBLEM ── brief: #F7F7F8 bg, 2-col cards, shadow-card */}
      <section className="py-28 px-6 bg-[#F7F7F8]">
        <div className="max-w-[1200px] mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-center mb-4" style={{ color: ACCENT }}>The Problem</p>
          <h2 className="text-4xl md:text-[42px] font-bold text-center text-gray-900 mb-16 leading-tight">Content workflows are broken</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: "📦", title: "Large files are slow to transfer", body: "Sending 4K videos over Google Drive or WeTransfer wastes hours every week." },
              { icon: "💬", title: "Feedback is scattered", body: "Notes in DMs, emails, and voice messages — no one knows what version is final." },
              { icon: "🔄", title: "Manual re-uploads", body: "Creators download, re-upload, and re-title videos themselves. Every. Single. Time." },
              { icon: "🔑", title: "Sharing YouTube access is risky", body: "Giving editors your YouTube password or channel access is a security nightmare." },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-7 border border-gray-100" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
                <span className="text-3xl mb-4 block">{item.icon}</span>
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── brief: white bg, 4-col steps */}
      <section id="how-it-works" className="py-28 px-6 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-center mb-4" style={{ color: ACCENT }}>How it works</p>
          <h2 className="text-4xl md:text-[42px] font-bold text-center text-gray-900 mb-4 leading-tight">Four steps. Zero friction.</h2>
          <p className="text-gray-500 text-center max-w-xl mx-auto mb-16 text-lg">No downloads. No shared passwords. No re-uploads.</p>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: Upload, step: "01", title: "Editor uploads", body: "Editor uploads the video directly to the platform. No file sharing needed." },
              { icon: Eye, step: "02", title: "Creator reviews", body: "Creator watches the video securely inside the platform with a signed URL." },
              { icon: FileCheck, step: "03", title: "Approve or reject", body: "One click to approve, or send feedback. Editor gets notified instantly." },
              { icon: Youtube, step: "04", title: "Published to YouTube", body: "Approved video is pushed directly to the creator's YouTube channel." },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-2xl p-6 border border-gray-100 h-full" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: "#eef2ff" }}>
                  <item.icon className="w-5 h-5" style={{ color: ACCENT }} />
                </div>
                <span className="text-xs font-bold tracking-widest" style={{ color: ACCENT }}>{item.step}</span>
                <h3 className="font-semibold text-gray-900 mt-1 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── brief: alternating 2-col sections, icon + text */}
      <section id="features" className="py-28 px-6 bg-[#F7F7F8]">
        <div className="max-w-[1200px] mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-center mb-4" style={{ color: ACCENT }}>Features</p>
          <h2 className="text-4xl md:text-[42px] font-bold text-center text-gray-900 mb-16 leading-tight">Everything you need, nothing you don't</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Upload, title: "Secure upload system", body: "Videos are stored privately on Cloudinary. No public links, ever." },
              { icon: Users, title: "Role-based access", body: "Separate dashboards for creators and editors. Everyone sees only what they need." },
              { icon: Eye, title: "Built-in video review", body: "Watch videos directly in the platform with signed, expiring URLs." },
              { icon: CheckCircle, title: "One-click approval", body: "Approve or reject with feedback. Instant notifications to the editor." },
              { icon: Youtube, title: "Direct YouTube publishing", body: "Push approved videos straight to YouTube. No re-uploading." },
              { icon: BarChart3, title: "Audit trail & logs", body: "Every action is logged. Know exactly who did what and when." },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-7 border border-gray-100" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: "#eef2ff" }}>
                  <f.icon className="w-5 h-5" style={{ color: ACCENT }} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECURITY ── brief: white bg, 2-col, checklist left, table right */}
      <section id="security" className="py-28 px-6 bg-white">
        <div className="max-w-[1200px] mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: ACCENT }}>Security</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">Built for security and trust</h2>
            <p className="text-gray-500 leading-relaxed mb-8 text-lg">Your videos, tokens, and credentials are protected at every layer.</p>
            <div className="space-y-4">
              {[
                { icon: Key, text: "OAuth-based login — no password sharing" },
                { icon: Shield, text: "No YouTube channel access sharing" },
                { icon: Lock, text: "Encrypted tokens (AES-256-CBC)" },
                { icon: Video, text: "Private video storage — no public links" },
                { icon: CheckCircle, text: "Signed URLs for secure playback (1hr expiry)" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "#eef2ff" }}>
                    <item.icon className="w-4 h-4" style={{ color: ACCENT }} />
                  </div>
                  <span className="text-gray-700 text-sm font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#F7F7F8] rounded-2xl p-8 border border-gray-100" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
            <div className="space-y-0">
              {[
                { label: "Video storage", value: "Cloudinary (authenticated)", status: "secure" },
                { label: "YouTube tokens", value: "AES-256 encrypted", status: "secure" },
                { label: "Video access", value: "Signed URLs, 1hr expiry", status: "secure" },
                { label: "Authentication", value: "JWT + Google OAuth", status: "secure" },
                { label: "Direct URL access", value: "Blocked (401)", status: "blocked" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between py-4 border-b border-gray-200 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{row.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{row.value}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${row.status === "secure" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                    {row.status === "secure" ? "✓ Secure" : "✗ Blocked"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── DEMO ── brief: #F7F7F8 bg, video mockup with strong shadow */}
      <section id="demo" className="py-28 px-6 bg-[#F7F7F8]">
        <div className="max-w-[900px] mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: ACCENT }}>Demo</p>
          <h2 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">See MediaLayer in action</h2>
          <p className="text-gray-500 mb-10 text-lg">Watch the full workflow from upload to YouTube publish.</p>
          <div className="rounded-2xl overflow-hidden aspect-video" style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.12)" }}>
            <iframe
              src="https://www.youtube.com/embed/i5V6dnPXCqI"
              className="w-full h-full"
              allowFullScreen
              title="MediaLayer Demo"
            />
          </div>
        </div>
      </section>

      {/* ── PRICING ── brief: white bg, 2-col cards */}
      <section id="pricing" className="py-28 px-6 bg-white">
        <div className="max-w-[900px] mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: ACCENT }}>Pricing</p>
          <h2 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">Pay once. Use forever.</h2>
          <p className="text-gray-500 mb-14 text-lg max-w-xl mx-auto">
            No subscriptions. No monthly fees. Pay one time and get full lifetime access.
          </p>
          <div className="grid md:grid-cols-2 gap-6 items-stretch text-left">

            {/* Starter */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 flex flex-col" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-400 mb-3">Starter</p>
                <div className="flex items-end gap-1.5 mb-1">
                  <span className="text-5xl font-bold text-gray-900">$50</span>
                  <span className="text-gray-400 text-sm mb-2">one-time</span>
                </div>
                <p className="text-gray-500 text-sm mb-7">Perfect for solo creators working with one editor.</p>
                <ul className="space-y-3 mb-8">
                  {["1 creator account", "Up to 3 editors", "Unlimited video reviews", "Direct YouTube publishing", "Email notifications", "Lifetime access"].map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 shrink-0" style={{ color: ACCENT }} /> {f}
                    </li>
                  ))}
                </ul>
              </div>
              <Link href="/register" className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-gray-200 text-gray-900 font-semibold hover:bg-gray-50 transition-colors text-sm">
                Get started <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Pro — brief: accent bg for featured plan */}
            <div className="rounded-2xl p-8 text-left relative overflow-hidden flex flex-col" style={{ backgroundColor: ACCENT, boxShadow: "0 8px 40px rgba(98,93,245,0.3)" }}>
              <span className="absolute top-5 right-5 px-2.5 py-1 rounded-full bg-white/20 text-white text-xs font-semibold">Most Popular</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white/60 mb-3">Pro</p>
                <div className="flex items-end gap-1.5 mb-1">
                  <span className="text-5xl font-bold text-white">$100</span>
                  <span className="text-white/60 text-sm mb-2">one-time</span>
                </div>
                <p className="text-white/70 text-sm mb-7">For growing channels with multiple editors and higher volume.</p>
                <ul className="space-y-3 mb-8">
                  {["Unlimited creator accounts", "Unlimited editors", "Unlimited video reviews", "Direct YouTube publishing", "Priority email support", "Audit logs & analytics", "Lifetime access"].map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-white">
                      <CheckCircle className="w-4 h-4 text-white/60 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
              <Link href="/register" className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white font-semibold hover:bg-gray-50 transition-colors text-sm" style={{ color: ACCENT }}>
                Get started <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-6">No subscriptions · No hidden fees · Pay once, own it forever</p>
        </div>
      </section>

      {/* ── TESTIMONIALS ── brief: carousel-style, avatar + quote + company */}
      <section className="py-28 px-6 bg-[#F7F7F8]">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16 leading-tight">What creators are saying</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "MediaLayer cut our review cycle from 2 days to 2 hours. It's the missing piece for any creator-editor team.",
                name: "Alex R.", role: "YouTube Creator, 200k subscribers",
              },
              {
                quote: "No more sending huge files over WeTransfer. My editor uploads directly and I approve in one click. Game changer.",
                name: "Sarah M.", role: "Content Creator, 500k subscribers",
              },
              {
                quote: "The YouTube direct publish feature alone is worth it. I never have to touch the upload process anymore.",
                name: "James K.", role: "Indie Filmmaker",
              },
            ].map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-7 border border-gray-100" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
                <p className="text-gray-700 text-sm leading-relaxed mb-6 italic">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ backgroundColor: ACCENT }}>
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── brief: white bg, large headline, dual pill CTAs */}
      <section className="py-28 px-6 bg-white">
        <div className="max-w-[700px] mx-auto text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">Start using MediaLayer today</h2>
          <p className="text-gray-500 text-lg mb-10">Join creators and editors who are already using a better workflow.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="flex items-center gap-2 px-8 py-3.5 rounded-full text-white font-semibold transition-colors text-sm" style={{ backgroundColor: ACCENT }}>
              Get started free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login" className="flex items-center gap-2 px-8 py-3.5 rounded-full border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors text-sm">
              Sign in
            </Link>
          </div>
          <p className="text-xs text-gray-400 mt-6">Free to start · No credit card required</p>
        </div>
      </section>

      {/* ── FOOTER ── brief: clean, minimal, logo left, links right */}
      <footer className="border-t border-gray-100 py-10 px-6 bg-white">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <img src="/images/logo.png" alt="MediaLayer" className="h-6 w-auto object-contain" />
            <span className="text-gray-400 text-sm ml-1">© 2026</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/privacy" className="hover:text-gray-900 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-900 transition-colors">Terms</Link>
            <a href="mailto:patanvadiyabansi6@gmail.com" className="hover:text-gray-900 transition-colors">Contact</a>
            <a href="https://x.com" target="_blank" rel="noreferrer" className="hover:text-gray-900 transition-colors">Twitter</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
