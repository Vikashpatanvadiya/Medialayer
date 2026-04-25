import { Link } from "wouter";
import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion, useInView, useScroll, useTransform, useSpring } from "framer-motion";
import { Upload, Eye, CheckCircle, Youtube, Shield, Users, ArrowRight, ChevronDown, Check, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";

const P = "var(--purple-4)";
const P1 = "var(--purple-1)";
const SERIF = "'Playfair Display', Georgia, serif";

// ── Cursor follower ───────────────────────────────────────────────────────────
function CursorFollower() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  useEffect(() => {
    const move = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);
  const x = useSpring(pos.x, { stiffness: 120, damping: 28 });
  const y = useSpring(pos.y, { stiffness: 120, damping: 28 });
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed z-[9999] w-10 h-10 rounded-full"
      style={{
        x, y,
        translateX: "-50%",
        translateY: "-50%",
        background: "rgba(145,141,246,0.15)",
        filter: "blur(8px)",
        mixBlendMode: "multiply",
      }}
    />
  );
}

// ── Line-reveal animation ─────────────────────────────────────────────────────
function RevealLine({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div
        initial={{ y: "100%" }}
        animate={inView ? { y: "0%" } : {}}
        transition={{ duration: 0.7, delay, ease: [0.76, 0, 0.24, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}

function FadeUp({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Editorial components ──────────────────────────────────────────────────────
function Tag({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-6 overflow-hidden">
      <div className="flex-1 h-px" style={{ background: "rgba(0,0,0,0.12)" }} />
      <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground whitespace-nowrap select-none flex items-center gap-2">
        <span className="opacity-40">·</span>
        {children}
        <span className="opacity-40">·</span>
      </span>
      <div className="flex-1 h-px" style={{ background: "rgba(0,0,0,0.12)" }} />
    </div>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-[36px] md:text-[44px] font-bold text-center text-foreground mb-4 leading-[1.1]"
      style={{ letterSpacing: "-0.03em" }}
    >
      {children}
    </h2>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-center mb-16 max-w-xl mx-auto leading-[1.75]" style={{ color: "#666", fontSize: "16px" }}>
      {children}
    </p>
  );
}

// ── Marquee ticker ────────────────────────────────────────────────────────────
const TICKER_ITEMS = [
  "Secure Upload", "In-Browser Review", "Approval Flow",
  "YouTube Publishing", "Role-Based Access", "Signed Playback",
  "No Shared Passwords", "Instant Notifications", "Audit Trail",
];

function Ticker() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const [dragLeft, setDragLeft] = useState(0);

  useEffect(() => {
    if (containerRef.current && stripRef.current) {
      const containerW = containerRef.current.offsetWidth;
      const stripW = stripRef.current.scrollWidth;
      setDragLeft(-(stripW - containerW));
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="border-y border-border bg-background select-none overflow-hidden cursor-grab active:cursor-grabbing"
    >
      <motion.div
        ref={stripRef}
        drag="x"
        dragConstraints={{ left: dragLeft, right: 0 }}
        dragElastic={0.05}
        dragTransition={{ bounceStiffness: 200, bounceDamping: 25 }}
        className="flex items-center py-3 w-max"
      >
        {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-6 px-8 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground whitespace-nowrap"
          >
            {item}
            <span className="opacity-25">·</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ── Hero workflow tabs ────────────────────────────────────────────────────────
const HERO_FLOW = [
  { label: "Upload Content",   urlSlug: "upload-content",   icon: Upload,      title: "Editor uploads the finished cut",      subtitle: "No Drive links. Uploads go straight into your workspace." },
  { label: "Review & Approve", urlSlug: "review-approve",   icon: Eye,         title: "Creator reviews in-browser",           subtitle: "Signed playback. Leave feedback. Approve or reject instantly." },
  { label: "Request Changes",  urlSlug: "request-changes",  icon: CheckCircle, title: "Request changes with context",         subtitle: "Send notes and get a new version—no messy threads." },
  { label: "Instant Publish",  urlSlug: "instant-publish",  icon: Youtube,     title: "Publish directly to YouTube",          subtitle: "After approval, push to your channel via OAuth—no re-upload." },
] as const;

function HeroWorkflow() {
  const [active, setActive] = useState(0);
  const item = HERO_FLOW[active];
  return (
    <div className="mt-10">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-full border border-border bg-background/70 shadow-sm backdrop-blur px-2 py-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
            {HERO_FLOW.map((t, i) => (
              <button
                key={t.label}
                type="button"
                onClick={() => setActive(i)}
                className={[
                  "relative h-10 rounded-full px-3 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  i === active ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                ].join(" ")}
                aria-current={i === active ? "true" : undefined}
              >
                <span className="relative z-10">{t.label}</span>
                {i === active && (
                  <motion.span
                    layoutId="hero-flow-pill"
                    className="absolute inset-0 rounded-full bg-muted shadow-[0_6px_18px_rgba(0,0,0,0.06)]"
                    transition={{ type: "spring", stiffness: 420, damping: 40 }}
                    aria-hidden="true"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 mx-auto max-w-5xl rounded-3xl border border-border bg-card/60 shadow-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-background/70">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="rounded-full px-4 py-1 text-xs bg-muted text-muted-foreground min-w-[280px] text-center">
              medialayer.app/{item.urlSlug}
            </div>
          </div>
        </div>
        <div className="p-5 sm:p-8" style={{ background: "linear-gradient(160deg, #ede9fe 0%, #ddd6fe 55%, #c4b5fd 100%)" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center justify-center gap-3 py-12 text-center"
            >
              <p className="text-lg font-semibold" style={{ color: "#4c1d95", fontFamily: SERIF, fontStyle: "italic" }}>{item.title}</p>
              <p className="text-sm max-w-sm" style={{ color: "#6d28d9" }}>{item.subtitle}</p>
            </motion.div>
          </AnimatePresence>
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

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-5 text-left gap-4">
        <span className="font-medium text-foreground" style={{ fontSize: "15px" }}>{q}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="leading-[1.75] pb-5" style={{ color: "#444", fontSize: "15px" }}>{a}</p>}
    </div>
  );
}

// ── Comparison table icon ─────────────────────────────────────────────────────
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

// ── Feature data ──────────────────────────────────────────────────────────────
const FEATURES = [
  {
    num: "01",
    icon: <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1" className="w-8 h-8"><path d="M16 4v16M10 14l6 6 6-6M6 24h20" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    title: "Secure upload.",
    desc: "Your editor uploads directly — no file sharing needed.",
    bullets: ["No Google Drive or WeTransfer", "Up to 2GB per video", "Private Cloudinary storage"],
  },
  {
    num: "02",
    icon: <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1" className="w-8 h-8"><circle cx="16" cy="16" r="10"/><circle cx="16" cy="16" r="4"/><path d="M6 16h4M22 16h4" strokeLinecap="round"/></svg>,
    title: "In-browser review.",
    desc: "Watch videos securely without downloading anything.",
    bullets: ["Signed URLs — no public links", "1-hour expiry for security", "No downloads ever needed"],
  },
  {
    num: "03",
    icon: <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1" className="w-8 h-8"><path d="M6 16l7 7 13-13" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    title: "Approval flow.",
    desc: "One-click approve or reject with feedback. Editor notified instantly.",
    bullets: ["Full submission history", "Rejection feedback loop", "Instant editor notifications"],
  },
  {
    num: "04",
    icon: <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1" className="w-8 h-8"><rect x="4" y="8" width="24" height="16" rx="2"/><path d="M13 12l8 4-8 4V12z" strokeLinejoin="round"/></svg>,
    title: "YouTube publishing.",
    desc: "Push approved videos directly to your channel. No re-uploading.",
    bullets: ["Direct YouTube OAuth", "No re-uploading ever", "Per-video publish tracking"],
  },
  {
    num: "05",
    icon: <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1" className="w-8 h-8"><path d="M16 4l3 9h9l-7 5 3 9-8-6-8 6 3-9-7-5h9z" strokeLinejoin="round"/></svg>,
    title: "Privacy-first.",
    desc: "No shared passwords. OAuth-based login. AES-256 encrypted tokens. Signed URLs that expire in 1 hour.",
    bullets: [],
  },
  {
    num: "06",
    icon: <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1" className="w-8 h-8"><circle cx="12" cy="10" r="4"/><circle cx="22" cy="14" r="3"/><path d="M4 26c0-4 3.6-7 8-7s8 3 8 7M20 20c2.2.7 4 2.8 4 5" strokeLinecap="round"/></svg>,
    title: "Role-based access.",
    desc: "Separate dashboards for creators and editors. Connect via invite code.",
    bullets: [],
  },
];

// ── Main page ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.6]);

  const navItems: Array<{ label: string; href: string; route?: boolean; external?: boolean }> = [
    { label: "Features", href: "#features" },
    { label: "Pricing",  href: "#pricing" },
    { label: "FAQ",      href: "#faq" },
    { label: "Blog",     href: "https://www.notion.so/MediaLayer-Documentation-3332bb9b545a80d8a9dbeff488a8bf79?source=copy_link", external: true },
    { label: "Login",    href: "/login", route: true },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground antialiased" style={{ fontSize: "16px" }}>
      <CursorFollower />

      {/* ── Column cage ── */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-40 flex justify-center">
        <div className="w-full max-w-[1100px] mx-auto relative">
          <span className="absolute inset-y-0 left-0 w-px" style={{ background: "rgba(0,0,0,0.10)" }} />
          <span className="absolute inset-y-0 right-0 w-px" style={{ background: "rgba(0,0,0,0.10)" }} />
        </div>
      </div>

      {/* ── NAV ── */}
      <header className="fixed top-4 inset-x-0 z-50 px-4 flex justify-center">
        <nav
          aria-label="Primary"
          className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/80 px-2 py-2 shadow-lg backdrop-blur-lg"
        >
          <Link
            href="/"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background/70 shadow-sm transition-colors hover:bg-muted mr-1"
            aria-label="Home"
          >
            <img src="/favicon.svg" alt="" className="h-4 w-4" />
          </Link>

          <div className="hidden sm:flex items-center gap-0.5">
            {navItems.filter(i => !i.route).map(item => (
              <a
                key={item.label}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noreferrer" : undefined}
                className="inline-flex h-9 items-center rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-1 ml-1">
            <div className="hidden sm:flex items-center gap-1">
              <Link href="/login" className="contents">
                <Button variant="ghost" size="sm" className="rounded-full">Login</Button>
              </Link>
              <Link href="/register" className="contents">
                <Button size="sm" className="rounded-full text-white" style={{ background: "#111" }}>
                  Register
                </Button>
              </Link>
            </div>
            <div className="sm:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Open menu"><Menu className="h-5 w-5" /></Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[320px]">
                  <SheetHeader>
                    <SheetTitle className="flex items-center justify-between gap-3">
                      <span>Menu</span>
                      <SheetClose asChild>
                        <Button variant="ghost" size="icon" aria-label="Close menu"><X className="h-5 w-5" /></Button>
                      </SheetClose>
                    </SheetTitle>
                  </SheetHeader>
                  <div className="px-6 pb-6">
                    <div className="mt-3 flex flex-col gap-1">
                      {navItems.map(item => item.route ? (
                        <Link key={item.label} href={item.href} className="contents">
                          <Button variant="ghost" className="justify-start">{item.label}</Button>
                        </Link>
                      ) : (
                        <a key={item.label} href={item.href} target={item.external ? "_blank" : undefined} rel={item.external ? "noreferrer" : undefined} className="contents">
                          <Button variant="ghost" className="justify-start">{item.label}</Button>
                        </a>
                      ))}
                    </div>
                    <div className="mt-4 grid gap-2">
                      <Link href="/register" className="contents">
                        <Button className="text-white" style={{ background: "#111" }}>Register</Button>
                      </Link>
                      <Link href="/login" className="contents">
                        <Button variant="outline">Login</Button>
                      </Link>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </nav>
      </header>

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative pt-32 pb-0 bg-background overflow-hidden">
        <div className="relative max-w-[1100px] mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16 min-h-[80vh] py-16">

            {/* Left — text */}
            <div className="flex-1 lg:w-[55%]">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold mb-6"
                style={{ background: P1, color: P, borderColor: "var(--purple-2)" }}
              >
                Early Access — Limited Spots
              </motion.p>

              <div className="mb-6">
                <RevealLine delay={0.05}>
                  <h1
                    className="text-[56px] md:text-[72px] lg:text-[80px] font-bold leading-[1.02] text-foreground"
                    style={{ letterSpacing: "-0.03em" }}
                  >
                    The layer that makes
                  </h1>
                </RevealLine>
                <RevealLine delay={0.13}>
                  <h1
                    className="text-[56px] md:text-[72px] lg:text-[80px] font-bold leading-[1.02]"
                    style={{ letterSpacing: "-0.03em", color: P }}
                  >
                    media move.
                  </h1>
                </RevealLine>
              </div>

              <FadeUp delay={0.3}>
                <p className="max-w-md leading-[1.75] mb-8" style={{ color: "#444", fontSize: "16px" }}>
                  Your editor uploads. You review securely. One click publishes to YouTube. No downloads, no shared passwords.
                </p>
              </FadeUp>

              <FadeUp delay={0.4}>
                <div className="flex flex-col sm:flex-row items-start gap-4 mb-10">
                  <Link href="/register">
                    <motion.button
                      whileHover={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.15), 0 8px 24px rgba(0,0,0,0.3)" }}
                      transition={{ duration: 0.2 }}
                      className="px-7 py-3 rounded-full text-white text-sm font-semibold"
                      style={{ background: "#111" }}
                    >
                      Start 14 day free trial
                    </motion.button>
                  </Link>
                  <a
                    href="https://youtu.be/yByh_eDWNMI?si=GjZngWBRG0GAO0mx"
                    target="_blank"
                    rel="noreferrer"
                    className="group inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-3"
                  >
                    See demo
                    <motion.span
                      className="inline-block"
                      initial={{ x: 0 }}
                      whileHover={{ x: 4 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                      →
                    </motion.span>
                  </a>
                </div>
              </FadeUp>

              {/* Trusted by strip */}
              <FadeUp delay={0.5}>
                <div className="flex items-center gap-6 opacity-40">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground whitespace-nowrap">Used by</span>
                  {["Creators", "Agencies", "Studios", "Freelancers"].map(label => (
                    <span key={label} className="text-xs font-medium text-foreground">{label}</span>
                  ))}
                </div>
              </FadeUp>
            </div>

            {/* Right — hero image */}
            <motion.div
              className="flex-1 lg:w-[55%] w-full"
              style={{ scale: heroScale, opacity: heroOpacity }}
            >
              <img
                src="/hero_image.png"
                alt="MediaLayer workflow"
                className="w-full h-auto scale-110 origin-center"
                style={{ display: "block" }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── TICKER ── */}
      <Ticker />
      <hr style={{ border: "none", borderTop: "1px solid var(--gray-2)", margin: 0 }} />

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-6" style={{ background: "#f7f7f7" }}>
        <div className="max-w-[1100px] mx-auto">

          <FadeUp>
            <div className="text-center mb-4">
              <h2 className="block leading-[1.1]" style={{ fontSize: "52px", fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.02em", color: "#111" }}>
                Everything you need
              </h2>
              <h2 className="block leading-[1.1]" style={{ fontSize: "52px", fontWeight: 700, letterSpacing: "-0.03em", color: "#111" }}>
                to manage your workflow
              </h2>
            </div>
          </FadeUp>
          <FadeUp delay={0.08}>
            <p className="text-center mx-auto mb-12" style={{ fontSize: "16px", color: "#666", maxWidth: "480px", lineHeight: 1.6 }}>
              From secure uploads to direct YouTube publishing — MediaLayer handles the entire creator-editor pipeline.
            </p>
          </FadeUp>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
            {[
              { img: "/features/feature_1_card.png", title: "Secure upload", desc: "Your editor uploads directly — no Google Drive or WeTransfer. Up to 2GB, stored privately." },
              { img: "/features/feature_2_card.png", title: "In-browser review", desc: "Watch videos securely without downloading. Signed URLs expire in 1 hour — no public links." },
              { img: "/features/feature_3_card.png", title: "Approval flow", desc: "One-click approve or reject with feedback. Editor notified instantly. Full submission history." },
              { img: "/features/feature_4_card.png", title: "YouTube publishing", desc: "Push approved videos directly to your channel via OAuth. No re-uploading, ever." },
              { img: "/features/feature_5_card.png", title: "Role-based access", desc: "Separate dashboards for creators and editors. Connect via invite code." },
              { img: null, title: "Privacy-first security", desc: "No shared passwords. AES-256 encrypted tokens. Signed URLs. Helmet security headers on every response." },
            ].map((f, i) => (
              <FadeUp key={i} delay={i * 0.05}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="relative flex flex-col"
                  style={{ background: "#ebebeb", borderRadius: "16px", boxShadow: "0 1px 2px rgba(0,0,0,0.06)", padding: "28px", minHeight: "320px" }}
                >
                  <div className="flex items-center justify-center mb-5" style={{ height: "180px" }}>
                    {f.img ? (
                      <img src={f.img} alt={f.title} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(145,141,246,0.12)" }}>
                        <Shield className="w-8 h-8" style={{ color: P }} />
                      </div>
                    )}
                  </div>
                  <p style={{ fontWeight: 700, fontSize: "16px", color: "#111", marginBottom: "6px" }}>{f.title}</p>
                  <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.6 }}>{f.desc}</p>
                  <span className="absolute" style={{ bottom: "24px", right: "24px", color: "#999", fontSize: "14px" }}>→</span>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>
      <hr style={{ border: "none", borderTop: "1px solid var(--gray-2)", margin: 0 }} />

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-32 px-16 bg-background">
        <div className="max-w-[1100px] mx-auto">
          <FadeUp delay={0.05}><H2>Get started in minutes</H2></FadeUp>
          <FadeUp delay={0.1}><Sub>Setting things up is as simple as inviting your editor and connecting YouTube. No complex setup or confusing configuration.</Sub></FadeUp>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { num: "01", title: "Invite your editor.", desc: "Share an invite code. Your editor links to your account instantly.", blobs: ["var(--red-3)", "var(--sky-3)"], icon: <img src="/favicon.svg" alt="MediaLayer" className="w-6 h-6 brightness-0 invert" /> },
              { num: "02", title: "Editor uploads.", desc: "Your editor uploads the finished video directly. No file sharing needed.", blobs: ["var(--purple-3)", "var(--green-3)"], icon: <Upload className="w-5 h-5 text-white" /> },
              { num: "03", title: "Review & publish.", desc: "Approve or reject with feedback. One click publishes to YouTube.", blobs: ["var(--amber-3)", "var(--purple-3)"], icon: <CheckCircle className="w-5 h-5 text-white" /> },
            ].map((step, i) => (
              <FadeUp key={step.num} delay={i * 0.08}>
                <motion.div
                  whileHover={{ y: -6, borderColor: "rgba(145,141,246,0.4)" }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="rounded-2xl overflow-hidden border border-border"
                  style={{ background: "var(--bg-2)" }}
                >
                  <div className="h-48 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute w-28 h-28 rounded-full blur-2xl opacity-60" style={{ background: step.blobs[0], left: "5%", top: "10%" }} />
                    <div className="absolute w-28 h-28 rounded-full blur-2xl opacity-40" style={{ background: step.blobs[1], right: "5%", top: "10%" }} />
                    <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center z-10 shadow-md">
                      <div className="w-10 h-10 rounded-full bg-[#111] flex items-center justify-center">
                        {step.icon}
                      </div>
                    </div>
                  </div>
                  <div className="px-6 pb-8">
                    <div className="inline-flex items-center justify-center px-3 py-1 rounded-full mb-4 text-sm font-semibold" style={{ background: "var(--purple-1)", color: P }}>
                      {step.num}
                    </div>
                    <p style={{ fontSize: "15px", lineHeight: "1.6" }}>
                      <span className="font-semibold text-foreground">{step.title}</span>{" "}
                      <span style={{ color: "#666" }}>{step.desc}</span>
                    </p>
                  </div>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>
      <hr style={{ border: "none", borderTop: "1px solid var(--gray-2)", margin: 0 }} />

      {/* ── COMPARISON ── */}
      <section id="comparison" className="py-32 px-6 bg-background">
        <div className="max-w-[1100px] mx-auto">
          <FadeUp delay={0.05}><H2>How MediaLayer compares</H2></FadeUp>
          <FadeUp delay={0.1}><Sub>See how MediaLayer stacks up against the most popular video collaboration tools on the market.</Sub></FadeUp>

          <FadeUp delay={0.15}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th className="text-left pb-4 font-normal w-[30%]" />
                  <th className="pb-0 px-0 text-center w-[14%] align-bottom">
                    <div className="flex flex-col items-center gap-2 pt-4 pb-3 rounded-t-[20px]"
                      style={{ border: "1.5px solid var(--purple-3)", borderBottom: "none", background: "var(--purple-1)" }}>
                      <div className="w-10 h-10 rounded-full bg-[#111] flex items-center justify-center">
                        <img src="/favicon.svg" alt="MediaLayer" className="w-5 h-5 brightness-0 invert" />
                      </div>
                      <span className="text-xs font-medium" style={{ color: "var(--fg-3)" }}>MediaLayer</span>
                    </div>
                  </th>
                  {[
                    { label: "Frame.io",       logo: "https://www.frame.io/favicon.ico" },
                    { label: "Dropbox Replay", logo: "https://www.dropbox.com/static/images/favicon.ico" },
                    { label: "Google Drive",   logo: "https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png" },
                  ].map(col => (
                    <th key={col.label} className="pb-4 px-2 text-center w-[14%]">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-border shadow-sm overflow-hidden">
                          <img src={col.logo} alt={col.label} className="w-6 h-6 object-contain" />
                        </div>
                        <span className="text-[11px] font-medium leading-tight text-center" style={{ color: "var(--fg-3)" }}>{col.label}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {([
                  ["GDPR compliant",             "yes", "yes",     "yes",     "yes"],
                  ["No file size limits",        "yes", "yes",     "yes",     "partial"],
                  ["Secure video review",        "yes", "yes",     "yes",     "partial"],
                  ["One-click YouTube publish",  "yes", "no",      "no",      "no"],
                  ["Role-based access",          "yes", "yes",     "yes",     "yes"],
                  ["Feedback & approval flow",   "yes", "yes",     "yes",     "partial"],
                  ["No shared passwords",        "yes", "yes",     "yes",     "yes"],
                  ["Audit trail",                "yes", "yes",     "yes",     "yes"],
                  ["Direct YouTube publishing",  "yes", "no",      "no",      "no"],
                ] as [string,string,string,string,string][]).map(([label, ml, frameio, dropbox, drive], i, arr) => (
                  <tr key={label}>
                    <td className="py-4 pr-4 text-foreground" style={{ borderTop: "1px solid var(--gray-2)", fontSize: "14px" }}>{label}</td>
                    <td className="py-4 px-0 text-center" style={{
                      background: "var(--purple-1)",
                      borderLeft: "1.5px solid var(--purple-3)",
                      borderRight: "1.5px solid var(--purple-3)",
                      borderTop: i === 0 ? "none" : "1px solid var(--purple-2)",
                      ...(i === arr.length - 1 ? { borderBottom: "1.5px solid var(--purple-3)", borderBottomLeftRadius: "20px", borderBottomRightRadius: "20px" } : {}),
                    }}>
                      <CellIcon v={ml} />
                    </td>
                    {[frameio, dropbox, drive].map((v, j) => (
                      <td key={j} className="py-4 px-2 text-center" style={{ borderTop: "1px solid var(--gray-2)" }}>
                        <CellIcon v={v} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </FadeUp>
        </div>
      </section>
      <hr style={{ border: "none", borderTop: "1px solid var(--gray-2)", margin: 0 }} />

      {/* ── PRICING ── */}
      <section id="pricing" className="py-32 px-6" style={{ background: "var(--bg-1)" }}>
        <div className="max-w-[1100px] mx-auto">
          <FadeUp delay={0.05}><H2>Simplified pricing</H2></FadeUp>
          <FadeUp delay={0.1}><Sub>No confusing tiers. Pay once and get lifetime access — everything included.</Sub></FadeUp>

          <div className="grid md:grid-cols-2 gap-6 items-stretch max-w-3xl mx-auto">
            <FadeUp delay={0.1} className="h-full">
              <motion.div
                whileHover={{ y: -6, borderColor: "rgba(145,141,246,0.4)" }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="bg-card rounded-2xl border border-border p-8 flex flex-col h-full"
                style={{ boxShadow: "var(--shadow-2)" }}
              >
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Starter</p>
                <div className="flex items-end gap-1 mb-2">
                  <span className="text-4xl font-bold text-foreground" style={{ letterSpacing: "-0.03em" }}>$50</span>
                  <span className="text-muted-foreground text-sm mb-1.5">one-time</span>
                </div>
                <p className="mb-6 leading-relaxed" style={{ color: "#666", fontSize: "14px" }}>Perfect for solo creators working with one editor.</p>
                <ul className="space-y-3 mb-8 flex-1">
                  {["1 creator account", "Up to 3 editors", "Unlimited video reviews", "Direct YouTube publishing", "Email notifications", "Lifetime access"].map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-foreground" style={{ fontSize: "14px" }}>
                      <Check className="w-4 h-4 shrink-0" style={{ color: "var(--green-4)" }} /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/checkout?plan=starter" className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-full border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors">
                  Get started <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </FadeUp>

            <FadeUp delay={0.15} className="h-full">
              <motion.div
                whileHover={{ y: -6, boxShadow: "0 20px 48px rgba(145,141,246,0.5)" }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="rounded-2xl p-8 flex flex-col relative overflow-hidden h-full"
                style={{ background: P, boxShadow: "0 8px 32px rgba(145,141,246,0.35)" }}
              >
                <span className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}>Most popular</span>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.6)" }}>Pro</p>
                <div className="flex items-end gap-1 mb-2">
                  <span className="text-4xl font-bold text-white" style={{ letterSpacing: "-0.03em" }}>$100</span>
                  <span className="text-sm mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>one-time</span>
                </div>
                <p className="mb-6 leading-relaxed" style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px" }}>For growing channels with multiple editors.</p>
                <ul className="space-y-3 mb-8 flex-1">
                  {["Unlimited creator accounts", "Unlimited editors", "Unlimited video reviews", "Direct YouTube publishing", "Priority email support", "Audit logs & analytics", "Lifetime access"].map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-white" style={{ fontSize: "14px" }}>
                      <Check className="w-4 h-4 shrink-0" style={{ color: "rgba(255,255,255,0.7)" }} /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/checkout?plan=pro" className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-white text-sm font-semibold hover:bg-white/90 transition-colors" style={{ color: P }}>
                  Get started <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </FadeUp>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-6">No subscriptions · No hidden fees · Pay once, own it forever</p>
        </div>
      </section>
      <hr style={{ border: "none", borderTop: "1px solid var(--gray-2)", margin: 0 }} />

      {/* ── FAQ ── */}
      <section id="faq" className="py-32 px-6">
        <div className="max-w-[1100px] mx-auto">
          <FadeUp delay={0.05}><H2>Frequently asked questions</H2></FadeUp>
          <FadeUp delay={0.1}><Sub>Quick answers to common questions about pricing, privacy, setup, and more.</Sub></FadeUp>
          <FadeUp delay={0.15}>
            <div className="max-w-2xl mx-auto rounded-2xl border border-border bg-card px-8" style={{ boxShadow: "var(--shadow-1)" }}>
              {FAQ.map(item => <FaqItem key={item.q} {...item} />)}
            </div>
          </FadeUp>
        </div>
      </section>
      <hr style={{ border: "none", borderTop: "1px solid var(--gray-2)", margin: 0 }} />

      {/* ── FINAL CTA ── */}
      <section className="py-32 px-6" style={{ background: "linear-gradient(160deg, #ede9fe 0%, #ddd6fe 60%, #c4b5fd 100%)" }}>
        <div className="max-w-xl mx-auto text-center">
          <FadeUp>
            <h2
              className="text-[36px] md:text-[48px] font-semibold mb-5 leading-[1.1]"
              style={{ color: "#1e1b4b", letterSpacing: "-0.03em" }}
            >
              See what's driving your video workflow
            </h2>
            <p className="mb-8 leading-[1.75]" style={{ color: "#4c1d95", fontSize: "16px" }}>
              Start reviewing and publishing videos today. No downloads, no shared passwords.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <motion.button
                  whileHover={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.15), 0 8px 24px rgba(0,0,0,0.3)" }}
                  className="px-7 py-3 rounded-full text-white text-sm font-semibold"
                  style={{ background: "#111" }}
                >
                  Start 14 day free trial
                </motion.button>
              </Link>
              <a
                href="https://youtu.be/yByh_eDWNMI?si=GjZngWBRG0GAO0mx"
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-2 text-sm font-medium py-3"
                style={{ color: "#4c1d95" }}
              >
                See demo
                <motion.span initial={{ x: 0 }} whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>→</motion.span>
              </a>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#0e0e0e] text-white relative overflow-hidden">

        <div className="max-w-[1100px] mx-auto px-6 pt-14 pb-10 relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 pb-12">
            <div>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4">Product</p>
              <ul className="space-y-3 text-sm text-white/50">
                <li><Link href="/login" className="hover:text-white transition-colors">Login</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Register</Link></li>
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4">Features</p>
              <ul className="space-y-3 text-sm text-white/50">
                <li><span>Secure Upload</span></li>
                <li><span>Video Review</span></li>
                <li><span>YouTube Publish</span></li>
                <li><span>Audit Trail</span></li>
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4">Comparison</p>
              <ul className="space-y-3 text-sm text-white/50">
                <li><span>vs Google Drive</span></li>
                <li><span>vs WeTransfer</span></li>
                <li><span>vs Email</span></li>
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4">Company</p>
              <ul className="space-y-3 text-sm text-white/50">
                <li><a href="mailto:hello@medialayer.app" className="hover:text-white transition-colors">Contact</a></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>

          <div className="h-px mb-8" style={{ background: "rgba(255,255,255,0.08)" }} />

          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-normal text-sm" style={{ fontFamily: SERIF, fontStyle: "italic" }}>MediaLayer</span>
              <span className="text-white/30 text-sm">© 2026</span>
            </div>
            <p className="text-xs text-white/30">Built for creators who value their time.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
