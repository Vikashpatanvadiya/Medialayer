import { Link } from "wouter";
import { motion, useScroll, useTransform } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import {
  Upload, Eye, CheckCircle, Youtube, Shield, Lock,
  Key, Video, Users, FileCheck, BarChart3, Play,
  ArrowRight, ChevronLeft, ChevronRight, Heart, MessageCircle, Share2, MoreVertical, ChevronDown
} from "lucide-react";

const fade = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { show: { transition: { staggerChildren: 0.08 } } };

const SOCIAL_POSTS = [
  {
    name: "Alex Rivera",
    handle: "@alexcreates",
    time: "2 days ago",
    avatar: "A",
    text: "Finally no more sending huge files over Drive. My editor uploads directly and I just hit approve. Game changer for my workflow 🙌",
    likes: 12,
    comments: 3,
  },
  {
    name: "Jordan Kim",
    handle: "@jordanedits",
    time: "1 week ago",
    avatar: "J",
    text: "As an editor, being able to submit videos without needing my creator's YouTube login is huge. Feels way more professional.",
    likes: 8,
    comments: 2,
  },
  {
    name: "Phoebe Chen",
    handle: "@phoebecontent",
    time: "3 days ago",
    avatar: "P",
    text: "Without having to dl large files huge difference, stops entire process when screen just freezes 🌊",
    likes: 1,
    comments: 1,
  },
];


function SocialPostCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setCurrent((c) => (c + 1) % SOCIAL_POSTS.length), 4000);
    return () => clearInterval(t);
  }, []);

  const post = SOCIAL_POSTS[current];

  return (
    <div className="relative px-12 py-10 min-h-[200px] flex flex-col justify-center">
      {/* Nav arrows */}
      <button
        onClick={() => setCurrent((c) => (c - 1 + SOCIAL_POSTS.length) % SOCIAL_POSTS.length)}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center hover:bg-gray-200 transition-colors"
      >
        <ChevronLeft className="w-4 h-4 text-gray-500" />
      </button>
      <button
        onClick={() => setCurrent((c) => (c + 1) % SOCIAL_POSTS.length)}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center hover:bg-gray-200 transition-colors"
      >
        <ChevronRight className="w-4 h-4 text-gray-500" />
      </button>

      {/* Post */}
      <div key={current} className="animate-fade-in">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600">
              {post.avatar}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{post.name}</p>
              <p className="text-xs text-gray-400">{post.handle} · {post.time}</p>
            </div>
          </div>
          <MoreVertical className="w-4 h-4 text-gray-400" />
        </div>
        <p className="text-sm text-gray-700 leading-relaxed mb-4">{post.text}</p>
        <div className="flex items-center gap-6 text-xs text-gray-400">
          <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5" /> {post.likes}</span>
          <span className="flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5" /> {post.comments}</span>
          <span className="flex items-center gap-1.5"><Share2 className="w-3.5 h-3.5" /> Share</span>
        </div>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-1.5 mt-6">
        {SOCIAL_POSTS.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? "bg-indigo-500 w-6" : "bg-gray-300 w-1.5"}`}
          />
        ))}
      </div>
    </div>
  );
}

const Logo = () => (
  <>
    <img src="/Medialayer-Indigo.svg" alt="MediaLayer" className="h-7 dark:hidden" />
    <img src="/logomark-medialayer-02.svg" alt="MediaLayer" className="h-7 hidden dark:block" />
  </>
);

const HOW_STEPS = [
  {
    step: "01",
    title: "Editor uploads",
    body: "Editor uploads the video directly. No file sharing or Drive links needed.",
    gradient: "linear-gradient(135deg, #c7d2fe 0%, #818cf8 50%, #6366f1 100%)",
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 22V10M18 10L13 15M18 10L23 15" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 26h18" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    step: "02",
    title: "Creator reviews",
    body: "Watch the video securely inside the platform with a signed, expiring URL.",
    gradient: "linear-gradient(135deg, #fde68a 0%, #f59e0b 50%, #d97706 100%)",
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="18" cy="18" rx="10" ry="6.5" stroke="white" strokeWidth="2.2"/>
        <circle cx="18" cy="18" r="3" stroke="white" strokeWidth="2.2"/>
      </svg>
    ),
  },
  {
    step: "03",
    title: "Approve or reject",
    body: "One click to approve, or send feedback. Editor gets notified instantly.",
    gradient: "linear-gradient(135deg, #bbf7d0 0%, #34d399 50%, #059669 100%)",
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 8h7l5 5v15a1 1 0 01-1 1H13a1 1 0 01-1-1V9a1 1 0 011-1z" stroke="white" strokeWidth="2.2" strokeLinejoin="round"/>
        <path d="M20 8v6h5" stroke="white" strokeWidth="2.2" strokeLinejoin="round"/>
        <path d="M14.5 20.5l2.5 2.5 5-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    step: "04",
    title: "Published to YouTube",
    body: "Approved video is pushed directly to the creator's YouTube channel.",
    gradient: "linear-gradient(135deg, #fecaca 0%, #f87171 50%, #ef4444 100%)",
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="10" width="26" height="16" rx="4" stroke="white" strokeWidth="2.2"/>
        <path d="M15 14.5l7 3.5-7 3.5V14.5z" fill="white"/>
      </svg>
    ),
  },
];

function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="py-24 px-6"
      style={{ background: "#ffffff" }}
    >
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-bold text-[#1a1f3c] mb-4">
            A better workflow for creators &amp; editors
          </h2>
          <p className="text-gray-500 text-lg">Four steps. No downloads. No shared passwords.</p>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {HOW_STEPS.map((item) => (
            <div key={item.step} className="rounded-3xl overflow-hidden" style={{ background: "#eeedf8", padding: "16px 16px 0 16px" }}>
              <div className="rounded-2xl flex items-center justify-center" style={{ background: item.gradient, height: "180px" }}>
                <div className="w-20 h-20 rounded-2xl bg-white/25 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  {item.icon}
                </div>
              </div>
              <div className="px-2 py-5 text-center">
                <span className="text-xs font-bold text-indigo-400 tracking-widest block mb-1">{item.step}</span>
                <h3 className="font-bold text-[#1a1f3c] text-base mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const FAQ_ITEMS = [
  {
    q: "Do I need to share my YouTube password with my editor?",
    a: "Never. MediaLayer uses OAuth — your editor never sees your credentials. You connect your YouTube channel once, and MediaLayer handles publishing on your behalf.",
  },
  {
    q: "How does the video review process work?",
    a: "Your editor uploads the finished video directly to MediaLayer. You get notified, watch it securely in the browser (no download needed), then approve or reject with optional feedback. If approved, one click publishes it to YouTube.",
  },
  {
    q: "Is my video stored securely?",
    a: "Yes. Videos are stored privately on Cloudinary and are never accessible via a public URL. Playback uses signed URLs that expire after 1 hour, so only authenticated users can watch.",
  },
  {
    q: "Can I work with multiple editors?",
    a: "Yes. The Starter plan supports up to 3 editors. The Pro plan supports unlimited editors across unlimited creator accounts.",
  },
  {
    q: "What happens after I approve a video?",
    a: "The video is pushed directly to your YouTube channel as a public video. Your editor gets an email notification and can see the YouTube link inside the platform.",
  },
  {
    q: "Is this a subscription or a one-time payment?",
    a: "One-time payment. Pay once and use MediaLayer forever — no monthly fees, no hidden charges.",
  },
  {
    q: "What video formats are supported?",
    a: "MP4 and MOV files up to 2GB. Cloudinary handles transcoding so your editor can upload in either format.",
  },
];

function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 px-6" style={{ background: "linear-gradient(180deg, #f0eef8 0%, #eeeaf8 100%)" }}>
      <div className="max-w-[720px] mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center text-[#1a1f3c] mb-14">FAQs</h2>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden"
              style={{ background: "rgba(99,102,241,0.07)" }}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left gap-4"
              >
                <span className="font-semibold text-[#1a1f3c] text-base leading-snug">{item.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-indigo-500 shrink-0 transition-transform duration-200 ${open === i ? "rotate-180" : ""}`}
                />
              </button>

              {open === i && (
                <div className="px-6 pb-5 border-t border-indigo-100/60">
                  <p className="text-gray-600 text-sm leading-relaxed pt-4">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DemoVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => videoRef.current?.play();
  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div
      className="relative bg-black"
      style={{ paddingTop: "62.5%" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={videoRef}
        src="https://res.cloudinary.com/dasrs5xx0/video/upload/v1774847598/Screen_Recording_2026-03-30_at_12.52.54_AM_twwjhf.mp4"
        muted
        playsInline
        loop
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "block", objectFit: "cover" }}
      />
    </div>
  );
}

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
            </motion.div>
          </motion.div>

          {/* Demo video — browser frame */}
          <motion.div
            id="demo"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="rounded-2xl overflow-hidden shadow-2xl shadow-indigo-200/50 border border-white/60 max-w-4xl mx-auto"
            style={{ background: "#f0eef8" }}
          >
            {/* Browser chrome */}
            <div className="px-4 py-3 flex items-center gap-3" style={{ background: "#e8e6f0" }}>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <div className="w-3 h-3 rounded-full bg-[#28c840]" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-white/80 border border-white/60 rounded-md px-4 py-1 text-xs text-gray-400 w-56 text-center tracking-tight">
                  medialayer.vercel.app
                </div>
              </div>
              <div className="w-16" />
            </div>

            {/* Video */}
            <DemoVideo />
          </motion.div>
        </div>
      </section>

      {/* ── SECTION DIVIDER ── */}
      <div style={{ height: "80px", background: "linear-gradient(180deg, #ddd8f0 0%, #ffffff 100%)" }} />

      {/* ── HOW IT WORKS ── */}
      <HowItWorks />

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-6" style={{ background: "#f7f7f8" }}>
        <div className="max-w-[1100px] mx-auto">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fade} className="text-4xl md:text-5xl font-bold text-center text-[#1a1f3c] mb-4">
              Features
            </motion.h2>
            <motion.p variants={fade} className="text-center text-gray-500 text-lg mb-14">
              Everything you need to run a smooth creator–editor workflow.
            </motion.p>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { icon: Upload, title: "Secure upload", body: "Videos stored privately on Cloudinary. No public links, ever.", color: "#fff3e8", iconColor: "#f97316" },
                { icon: Users, title: "Role-based access", body: "Separate dashboards for creators and editors.", color: "#fce8f0", iconColor: "#e0457b" },
                { icon: Eye, title: "Built-in review", body: "Watch videos directly in the platform with signed URLs.", color: "#e8f0fe", iconColor: "#4f6ef7" },
                { icon: CheckCircle, title: "One-click approval", body: "Approve or reject with feedback. Instant notifications.", color: "#e8faf0", iconColor: "#22c55e" },
                { icon: Youtube, title: "YouTube publishing", body: "Push approved videos straight to YouTube.", color: "#fce8e8", iconColor: "#ef4444" },
                { icon: BarChart3, title: "Audit trail", body: "Every action is logged. Know exactly who did what.", color: "#f0e8fe", iconColor: "#8b5cf6" },
                { icon: Lock, title: "Encrypted tokens", body: "YouTube OAuth tokens encrypted with AES-256.", color: "#e8f5fe", iconColor: "#0ea5e9" },
                { icon: Shield, title: "No password sharing", body: "Creators never share YouTube credentials.", color: "#f0fce8", iconColor: "#16a34a" },
              ].map((f) => (
                <motion.div
                  key={f.title}
                  variants={fade}
                  className="flex items-center gap-5 bg-white rounded-2xl px-6 py-5 border border-gray-100 shadow-[0px_2px_8px_rgba(0,0,0,0.04)]"
                >
                  {/* Blob icon */}
                  <div
                    className="shrink-0 w-14 h-14 rounded-[40%_60%_55%_45%/50%_45%_55%_50%] flex items-center justify-center"
                    style={{ background: f.color }}
                  >
                    <f.icon className="w-6 h-6" style={{ color: f.iconColor }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1a1f3c] text-sm mb-0.5">
                      {f.title}.{" "}
                      <span className="font-normal text-gray-500">{f.body}</span>
                    </h3>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── SEE IT IN ACTION ── */}
      <section id="testimonials" className="py-24 px-6" style={{ background: "linear-gradient(160deg, #f0eef8 0%, #e8e4f5 100%)" }}>
        <div className="max-w-[1100px] mx-auto">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fade} className="text-4xl md:text-5xl font-bold text-center text-[#1a1f3c] mb-16">
              See it in action
            </motion.h2>

            {/* Browser mockup with social post carousel */}
            <motion.div variants={fade} className="w-full max-w-3xl mx-auto mb-20">
              <div className="rounded-2xl overflow-hidden shadow-2xl shadow-indigo-200/40 border border-gray-200 bg-white">
                {/* Browser chrome */}
                <div className="bg-gray-100 border-b border-gray-200 px-4 py-3 flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="bg-white border border-gray-200 rounded-md px-4 py-1 text-xs text-gray-400 w-52 text-center">
                      medialayer.vercel.app
                    </div>
                  </div>
                  <div className="w-16" />
                </div>

                {/* Social post content */}
                <SocialPostCarousel />
              </div>
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
                <Link href="/checkout?plan=starter" className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-900 font-semibold hover:bg-gray-50 transition-colors text-sm">
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
                <Link href="/checkout?plan=pro" className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-indigo-600 font-semibold hover:bg-indigo-50 transition-colors text-sm">
                  Claim Offer <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

            </motion.div>
            <motion.p variants={fade} className="text-xs text-gray-400 text-center mt-6">No subscriptions · No hidden fees · Pay once, own it forever</motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <FaqSection />

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
      <footer className="bg-[#111111] text-white pt-16 pb-0 px-6">
        <div className="max-w-[1100px] mx-auto">

          {/* Link columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 pb-14 border-b border-white/10">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-5">Product</p>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How it works</a></li>
                <li><a href="#demo" className="hover:text-white transition-colors">Demo</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-5">Use Cases</p>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><span>YouTube Creators</span></li>
                <li><span>Video Editors</span></li>
                <li><span>Content Agencies</span></li>
                <li><span>Freelancers</span></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-5">Security</p>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><a href="#security" className="hover:text-white transition-colors">Security overview</a></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-5">Company</p>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><a href="mailto:vpatanvadiya2022@gmail.com" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="https://x.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Twitter / X</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="py-6 flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Social icons */}
            <div className="flex items-center gap-3">
              <a href="https://x.com" target="_blank" rel="noreferrer"
                className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/40 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer"
                className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/40 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
            </div>

            {/* Legal */}
            <div className="flex items-center gap-6 text-xs text-gray-500">
              <Link href="/terms" className="hover:text-gray-300 transition-colors">Terms &amp; Policies</Link>
              <Link href="/privacy" className="hover:text-gray-300 transition-colors">Privacy</Link>
              <span>© 2026 MediaLayer. All rights reserved.</span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
