import { Link } from "wouter";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { ScreenshotCarousel } from "@/components/ui/screenshot-carousel";
import {
  Upload, Eye, CheckCircle, Youtube, Shield, Lock,
  Key, Video, Users, FileCheck, BarChart3, Play,
  ArrowRight, ChevronRight
} from "lucide-react";

const fade = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { show: { transition: { staggerChildren: 0.08 } } };

const Logo = () => (
  <span style={{ fontFamily: "'Syne', sans-serif" }} className="font-extrabold text-[22px] tracking-tight text-[#1a1f3c]">
    MediaLayer
  </span>
);

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans antialiased">

      {/* ── NAV ── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-[1100px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/"><Logo /></Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#how-it-works" className="hover:text-gray-900 transition-colors">How it works</a>
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#testimonials" className="hover:text-gray-900 transition-colors">Customers</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
            <Link href="/login" className="hover:text-gray-900 transition-colors">Sign In</Link>
          </div>
          <Link href="/register" className="px-5 py-2 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200">
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="pt-16" style={{ background: "linear-gradient(160deg, #eeeaf8 0%, #e8e4f5 40%, #ddd8f0 100%)" }}>
        <div className="max-w-[1100px] mx-auto px-6 pt-20 pb-0 text-center">
          <motion.div initial="hidden" animate="show" variants={stagger}>
            <motion.div variants={fade}>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 text-indigo-700 text-xs font-semibold border border-indigo-100 mb-8 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                Early Access — Limited Spots
              </span>
            </motion.div>
            <motion.h1 variants={fade} className="text-5xl md:text-[64px] font-bold tracking-tight text-[#1a1f3c] leading-[1.1] mb-6 max-w-3xl mx-auto">
              Your editor uploads.<br />You approve. It publishes.
            </motion.h1>
            <motion.p variants={fade} className="text-lg md:text-xl text-gray-600 max-w-xl mx-auto mb-10 leading-relaxed">
              MediaLayer helps creators review and publish videos without downloads, re-uploads, or sharing YouTube access.
            </motion.p>
            <motion.div variants={fade} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link href="/register" className="px-8 py-3.5 rounded-full bg-indigo-600 text-white font-semibold text-base hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-300/40">
                Get MediaLayer for free
              </Link>
              <a href="#demo" className="flex items-center gap-2 text-gray-600 font-medium text-sm hover:text-gray-900 transition-colors">
                <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
                  <Play className="w-3.5 h-3.5 text-indigo-600 ml-0.5" />
                </div>
                Watch demo
              </a>
            </motion.div>
          </motion.div>

          {/* Demo video */}
          <motion.div
            id="demo"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="rounded-t-2xl overflow-hidden shadow-2xl shadow-indigo-200/50 border border-white/50 max-w-4xl mx-auto"
          >
            <div className="aspect-video bg-gray-900">
              <iframe
                src="https://www.youtube.com/embed/i5V6dnPXCqI"
                className="w-full h-full"
                allowFullScreen
                title="MediaLayer Demo"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 px-6 bg-white">
        <div className="max-w-[1100px] mx-auto">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fade} className="text-4xl md:text-5xl font-bold text-center text-[#1a1f3c] mb-4">
              A better workflow for creators & editors
            </motion.h2>
            <motion.p variants={fade} className="text-gray-500 text-center max-w-lg mx-auto mb-16 text-lg">
              Four steps. No downloads. No shared passwords.
            </motion.p>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { icon: Upload, step: "01", title: "Editor uploads", body: "Editor uploads the video directly. No file sharing or Drive links needed." },
                { icon: Eye, step: "02", title: "Creator reviews", body: "Watch the video securely inside the platform with a signed, expiring URL." },
                { icon: FileCheck, step: "03", title: "Approve or reject", body: "One click to approve, or send feedback. Editor gets notified instantly." },
                { icon: Youtube, step: "04", title: "Published to YouTube", body: "Approved video is pushed directly to the creator's YouTube channel." },
              ].map((item) => (
                <motion.div key={item.step} variants={fade} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0px_4px_8px_rgba(0,0,0,0.06)] hover:shadow-md transition-shadow">
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
                    <item.icon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <span className="text-xs font-bold text-indigo-400 tracking-widest">{item.step}</span>
                  <h3 className="font-bold text-gray-900 mt-1 mb-2 text-base">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.body}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-6 bg-gray-50 border-y border-gray-100">
        <div className="max-w-[1100px] mx-auto">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fade} className="text-4xl md:text-5xl font-bold text-center text-[#1a1f3c] mb-16">Features</motion.h2>
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { icon: Upload, title: "Secure upload", body: "Videos stored privately on Cloudinary. No public links, ever." },
                { icon: Users, title: "Role-based access", body: "Separate dashboards for creators and editors." },
                { icon: Eye, title: "Built-in review", body: "Watch videos directly in the platform with signed URLs." },
                { icon: CheckCircle, title: "One-click approval", body: "Approve or reject with feedback. Instant notifications." },
                { icon: Youtube, title: "YouTube publishing", body: "Push approved videos straight to YouTube." },
                { icon: BarChart3, title: "Audit trail", body: "Every action is logged. Know exactly who did what." },
                { icon: Lock, title: "Encrypted tokens", body: "YouTube OAuth tokens encrypted with AES-256." },
                { icon: Shield, title: "No password sharing", body: "Creators never share YouTube credentials." },
              ].map((f) => (
                <motion.div key={f.title} variants={fade} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1a1f3c] flex items-center justify-center shrink-0">
                    <f.icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">{f.title}</h3>
                    <p className="text-gray-500 text-xs leading-relaxed">{f.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── SLIDESHOW ── */}
      <section id="testimonials" className="py-24 px-6" style={{ background: "linear-gradient(160deg, #f0eef8 0%, #e8e4f5 100%)" }}>
        <div className="max-w-[1100px] mx-auto">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fade} className="text-4xl md:text-5xl font-bold text-center text-[#1a1f3c] mb-16">
              See it in action
            </motion.h2>
            <motion.div variants={fade}>
              <ScreenshotCarousel />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── SECURITY ── */}
      <section className="py-24 px-6 bg-[#1a2a1a]">
        <div className="max-w-[1100px] mx-auto">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger} className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <motion.p variants={fade} className="text-green-400 font-semibold text-sm uppercase tracking-widest mb-4">Security</motion.p>
              <motion.h2 variants={fade} className="text-3xl md:text-4xl font-bold text-white mb-6">Built for security and trust</motion.h2>
              <motion.div variants={stagger} className="space-y-4">
                {[
                  { icon: Key, text: "OAuth-based login — no password sharing" },
                  { icon: Shield, text: "No YouTube channel access sharing" },
                  { icon: Lock, text: "Encrypted tokens (AES-256-CBC)" },
                  { icon: Video, text: "Private video storage — no public links" },
                  { icon: CheckCircle, text: "Signed URLs for secure playback (1hr expiry)" },
                ].map((item) => (
                  <motion.div key={item.text} variants={fade} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-900/50 flex items-center justify-center shrink-0">
                      <item.icon className="w-4 h-4 text-green-400" />
                    </div>
                    <span className="text-gray-300 text-sm font-medium">{item.text}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>
            <motion.div variants={fade} className="bg-[#0f1a0f] rounded-3xl p-8 border border-green-900/30">
              {[
                { label: "Video storage", value: "Cloudinary (authenticated)", ok: true },
                { label: "YouTube tokens", value: "AES-256 encrypted", ok: true },
                { label: "Video access", value: "Signed URLs, 1hr expiry", ok: true },
                { label: "Authentication", value: "JWT + Google OAuth", ok: true },
                { label: "Direct URL access", value: "Blocked (401)", ok: false },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between py-3 border-b border-green-900/20 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-white">{row.label}</p>
                    <p className="text-xs text-gray-500">{row.value}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${row.ok ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"}`}>
                    {row.ok ? "✓ Secure" : "✗ Blocked"}
                  </span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-24 px-6 bg-white">
        <div className="max-w-[900px] mx-auto">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fade} className="text-4xl md:text-5xl font-bold text-center text-[#1a1f3c] mb-4">
              Choose the plan that fits your needs.
            </motion.h2>
            <motion.p variants={fade} className="text-gray-500 text-center mb-14 text-lg">Pay once. Use forever. No subscriptions.</motion.p>
            <motion.div variants={fade} className="grid md:grid-cols-2 gap-6 items-stretch">

              {/* Starter */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-[0px_4px_8px_rgba(0,0,0,0.06)] p-8 flex flex-col">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-500 mb-1">Starter</p>
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
                <Link href="/register" className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-900 font-semibold hover:bg-gray-50 transition-colors text-sm">
                  Claim Offer <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Pro — highlighted */}
              <div className="bg-indigo-600 rounded-2xl p-8 flex flex-col relative overflow-hidden">
                <div className="absolute top-4 right-4">
                  <span className="px-2.5 py-1 rounded-full bg-white/20 text-white text-xs font-semibold">Most popular</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-indigo-200 mb-1">Pro</p>
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
            <motion.p variants={fade} className="text-xs text-gray-400 text-center mt-6">No subscriptions · No hidden fees · Pay once, own it forever</motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 px-6" style={{ background: "linear-gradient(160deg, #eeeaf8 0%, #e8e4f5 100%)" }}>
        <div className="max-w-2xl mx-auto text-center">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fade} className="text-4xl md:text-5xl font-bold text-[#1a1f3c] mb-6">
              Start using MediaLayer today
            </motion.h2>
            <motion.p variants={fade} className="text-gray-600 text-lg mb-10">
              Join creators and editors who are already using a better workflow.
            </motion.p>
            <motion.div variants={fade}>
              <Link href="/register" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-indigo-600 text-white font-semibold text-base hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-300/40">
                Get MediaLayer for free <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-white border-t border-gray-100 py-16 px-6">
        <div className="max-w-[1100px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Product</p>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><a href="#features" className="hover:text-gray-900 transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a></li>
                <li><a href="#how-it-works" className="hover:text-gray-900 transition-colors">How it works</a></li>
                <li><a href="#demo" className="hover:text-gray-900 transition-colors">Demo</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Use Cases</p>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><span className="text-gray-500">YouTube Creators</span></li>
                <li><span className="text-gray-500">Video Editors</span></li>
                <li><span className="text-gray-500">Content Agencies</span></li>
                <li><span className="text-gray-500">Freelancers</span></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Security</p>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><a href="#security" className="hover:text-gray-900 transition-colors">Security overview</a></li>
                <li><Link href="/privacy" className="hover:text-gray-900 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-gray-900 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Company</p>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><a href="mailto:patanvadiyabansi6@gmail.com" className="hover:text-gray-900 transition-colors">Contact</a></li>
                <li><a href="https://x.com" target="_blank" rel="noreferrer" className="hover:text-gray-900 transition-colors">Twitter / X</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <Link href="/"><Logo /></Link>
            <p className="text-sm text-gray-400">© 2026 MediaLayer. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
