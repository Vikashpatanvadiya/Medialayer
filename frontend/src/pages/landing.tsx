import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowRight, Upload, Eye, CheckCircle, Youtube,
  Shield, Lock, Key, Video, Users, FileCheck,
  BarChart3, ChevronRight, Play
} from "lucide-react";

const fade = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { show: { transition: { staggerChildren: 0.1 } } };

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans antialiased">

      {/* ── NAV ── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/images/logo.png" alt="MediaLayer" className="w-8 h-8 rounded-lg object-contain bg-white border border-gray-100 p-0.5" />
            <span className="font-bold text-lg tracking-tight text-gray-900">MediaLayer</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
            <a href="#how-it-works" className="hover:text-gray-900 transition-colors">How it works</a>
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#security" className="hover:text-gray-900 transition-colors">Security</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors hidden sm:block">Sign in</Link>
            <Link href="/register" className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm">
              Get Early Access
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial="hidden" animate="show" variants={stagger}>
            <motion.div variants={fade}>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100 mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                Early Access — Limited Spots
              </span>
            </motion.div>
            <motion.h1 variants={fade} className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900 leading-[1.1] mb-6">
              Your editor uploads.<br />
              <span className="text-indigo-600">You approve.</span> It publishes.
            </motion.h1>
            <motion.p variants={fade} className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
              MediaLayer helps creators review and publish videos without downloads, re-uploads, or sharing YouTube access.
            </motion.p>
            <motion.div variants={fade} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200">
                Get Early Access <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#demo" className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors">
                <Play className="w-4 h-4 text-indigo-500" /> Watch Demo
              </a>
            </motion.div>
          </motion.div>

          {/* Dashboard mockup removed */}
        </div>
      </section>

      {/* ── PROBLEM ── */}
      <section className="py-20 px-6 bg-gray-50 border-y border-gray-100">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.p variants={fade} className="text-indigo-600 font-semibold text-sm uppercase tracking-widest text-center mb-4">The Problem</motion.p>
            <motion.h2 variants={fade} className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-16">Content workflows are broken</motion.h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { icon: "📦", title: "Large files are slow to transfer", body: "Sending 4K videos over Google Drive or WeTransfer wastes hours every week." },
                { icon: "💬", title: "Feedback is scattered", body: "Notes in DMs, emails, and voice messages — no one knows what version is final." },
                { icon: "🔄", title: "Manual re-uploads", body: "Creators download, re-upload, and re-title videos themselves. Every. Single. Time." },
                { icon: "🔑", title: "Sharing YouTube access is risky", body: "Giving editors your YouTube password or channel access is a security nightmare." },
              ].map((item) => (
                <motion.div key={item.title} variants={fade} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <span className="text-3xl mb-4 block">{item.icon}</span>
                  <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.body}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.p variants={fade} className="text-indigo-600 font-semibold text-sm uppercase tracking-widest text-center mb-4">How it works</motion.p>
            <motion.h2 variants={fade} className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">A better workflow for creators & editors</motion.h2>
            <motion.p variants={fade} className="text-gray-500 text-center max-w-xl mx-auto mb-16">Four steps. No downloads. No shared passwords.</motion.p>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { icon: Upload, step: "01", title: "Editor uploads", body: "Editor uploads the video directly to the platform. No file sharing needed." },
                { icon: Eye, step: "02", title: "Creator reviews", body: "Creator watches the video securely inside the platform with a signed URL." },
                { icon: FileCheck, step: "03", title: "Approve or reject", body: "One click to approve, or send feedback. Editor gets notified instantly." },
                { icon: Youtube, step: "04", title: "Published to YouTube", body: "Approved video is pushed directly to the creator's YouTube channel." },
              ].map((item, i) => (
                <motion.div key={item.step} variants={fade} className="relative">
                  {i < 3 && <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gray-200 z-0" style={{ width: "calc(100% - 2rem)", left: "calc(50% + 2rem)" }} />}
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative z-10 h-full">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
                      <item.icon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <span className="text-xs font-bold text-indigo-400 tracking-widest">{item.step}</span>
                    <h3 className="font-semibold text-gray-900 mt-1 mb-2">{item.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{item.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-6 bg-gray-50 border-y border-gray-100">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.p variants={fade} className="text-indigo-600 font-semibold text-sm uppercase tracking-widest text-center mb-4">Features</motion.p>
            <motion.h2 variants={fade} className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-16">Everything you need, nothing you don't</motion.h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Upload, title: "Secure upload system", body: "Videos are stored privately on Cloudinary. No public links, ever." },
                { icon: Users, title: "Role-based access", body: "Separate dashboards for creators and editors. Everyone sees only what they need." },
                { icon: Eye, title: "Built-in video review", body: "Watch videos directly in the platform with signed, expiring URLs." },
                { icon: CheckCircle, title: "One-click approval", body: "Approve or reject with feedback. Instant notifications to the editor." },
                { icon: Youtube, title: "Direct YouTube publishing", body: "Push approved videos straight to YouTube. No re-uploading." },
                { icon: BarChart3, title: "Audit trail & logs", body: "Every action is logged. Know exactly who did what and when." },
              ].map((f) => (
                <motion.div key={f.title} variants={fade} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
                    <f.icon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.body}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── SECURITY ── */}
      <section id="security" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger} className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <motion.p variants={fade} className="text-indigo-600 font-semibold text-sm uppercase tracking-widest mb-4">Security</motion.p>
              <motion.h2 variants={fade} className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Built for security and trust</motion.h2>
              <motion.p variants={fade} className="text-gray-500 leading-relaxed mb-8">We take security seriously. Your videos, tokens, and credentials are protected at every layer.</motion.p>
              <motion.div variants={stagger} className="space-y-4">
                {[
                  { icon: Key, text: "OAuth-based login — no password sharing" },
                  { icon: Shield, text: "No YouTube channel access sharing" },
                  { icon: Lock, text: "Encrypted tokens (AES-256-CBC)" },
                  { icon: Video, text: "Private video storage — no public links" },
                  { icon: CheckCircle, text: "Signed URLs for secure playback (1hr expiry)" },
                ].map((item) => (
                  <motion.div key={item.text} variants={fade} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                      <item.icon className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="text-gray-700 text-sm font-medium">{item.text}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>
            <motion.div variants={fade} className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
              <div className="space-y-4">
                {[
                  { label: "Video storage", value: "Cloudinary (authenticated)", status: "secure" },
                  { label: "YouTube tokens", value: "AES-256 encrypted", status: "secure" },
                  { label: "Video access", value: "Signed URLs, 1hr expiry", status: "secure" },
                  { label: "Authentication", value: "JWT + Google OAuth", status: "secure" },
                  { label: "Direct URL access", value: "Blocked (401)", status: "blocked" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{row.label}</p>
                      <p className="text-xs text-gray-500">{row.value}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${row.status === "secure" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                      {row.status === "secure" ? "✓ Secure" : "✗ Blocked"}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── DEMO ── */}
      <section id="demo" className="py-24 px-6 bg-gray-50 border-y border-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.p variants={fade} className="text-indigo-600 font-semibold text-sm uppercase tracking-widest mb-4">Demo</motion.p>
            <motion.h2 variants={fade} className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">See how MediaLayer works in action</motion.h2>
            <motion.p variants={fade} className="text-gray-500 mb-10">Watch the full workflow from upload to YouTube publish.</motion.p>
            <motion.div variants={fade} className="rounded-2xl overflow-hidden border border-gray-200 shadow-xl shadow-gray-200/50 aspect-video">
              <iframe
                src="https://www.youtube.com/embed/i5V6dnPXCqI"
                className="w-full h-full"
                allowFullScreen
                title="MediaLayer Demo"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.p variants={fade} className="text-indigo-600 font-semibold text-sm uppercase tracking-widest mb-4">Pricing</motion.p>
            <motion.h2 variants={fade} className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Pay once. Use forever.</motion.h2>
            <motion.p variants={fade} className="text-gray-500 mb-12 leading-relaxed max-w-xl mx-auto">
              No subscriptions. No monthly fees. Pay one time and get full lifetime access — the price depends on the plan you choose.
            </motion.p>
            <motion.div variants={fade} className="grid md:grid-cols-2 gap-6 items-stretch">

              {/* Starter */}
              <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 text-left flex flex-col">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-500 mb-2">Starter</p>
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-4xl font-bold text-gray-900">$50</span>
                    <span className="text-gray-400 text-sm mb-1.5">one-time</span>
                  </div>
                  <p className="text-gray-500 text-sm mb-6">Perfect for solo creators working with one editor.</p>
                  <ul className="space-y-3 mb-8">
                    {["1 creator account", "Up to 3 editors", "Unlimited video reviews", "Direct YouTube publishing", "Email notifications", "Lifetime access"].map(f => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-indigo-500 shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link href="/register" className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-200 text-gray-900 font-semibold hover:bg-gray-50 transition-colors text-sm">
                  Claim Offer <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Pro */}
              <div className="bg-indigo-600 rounded-3xl p-8 text-left relative overflow-hidden flex flex-col">
                <div className="absolute top-4 right-4">
                  <span className="px-2.5 py-1 rounded-full bg-white/20 text-white text-xs font-semibold">Most Popular</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-indigo-200 mb-2">Pro</p>
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-4xl font-bold text-white">$100</span>
                    <span className="text-indigo-300 text-sm mb-1.5">one-time</span>
                  </div>
                  <p className="text-indigo-200 text-sm mb-6">For growing channels with multiple editors and higher volume.</p>
                  <ul className="space-y-3 mb-8">
                    {["Unlimited creator accounts", "Unlimited editors", "Unlimited video reviews", "Direct YouTube publishing", "Priority email support", "Audit logs & analytics", "Lifetime access"].map(f => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-white">
                        <CheckCircle className="w-4 h-4 text-indigo-300 shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link href="/register" className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-indigo-600 font-semibold hover:bg-indigo-50 transition-colors text-sm">
                  Claim Offer <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

            </motion.div>
            <motion.p variants={fade} className="text-xs text-gray-400 mt-6">No subscriptions · No hidden fees · Pay once, own it forever</motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── TRUST ── */}
      <section className="py-16 px-6 bg-gray-50 border-y border-gray-100">
        <div className="max-w-4xl mx-auto">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fade} className="text-2xl font-bold text-center text-gray-900 mb-10">Built with transparency</motion.h2>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              {[
                { icon: "🔍", title: "Google verification in progress", body: "Our OAuth app is being reviewed by Google for full public access." },
                { icon: "🏗️", title: "Secure infrastructure", body: "Built on Cloudinary, Google OAuth, and industry-standard encryption." },
                { icon: "🤝", title: "No misuse of user data", body: "We only access what's needed. No ads, no tracking, no data selling." },
              ].map((item) => (
                <motion.div key={item.title} variants={fade} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <span className="text-3xl mb-3 block">{item.icon}</span>
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm">{item.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{item.body}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fade} className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Start using MediaLayer today</motion.h2>
            <motion.p variants={fade} className="text-gray-500 text-lg mb-10">Join creators and editors who are already using a better workflow.</motion.p>
            <motion.div variants={fade} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200">
                Try Now <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/register" className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors">
                Get Early Access <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-gray-100 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <img src="/images/logo.png" alt="MediaLayer" className="w-6 h-6 rounded object-contain" />
            <span className="font-bold text-sm text-gray-900">MediaLayer</span>
            <span className="text-gray-400 text-sm ml-2">© 2026</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/privacy" className="hover:text-gray-900 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-gray-900 transition-colors">Terms of Service</Link>
            <a href="mailto:patanvadiyabansi6@gmail.com" className="hover:text-gray-900 transition-colors">Contact</a>
            <a href="https://x.com" target="_blank" rel="noreferrer" className="hover:text-gray-900 transition-colors">X / Twitter</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
