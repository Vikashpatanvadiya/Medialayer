import { Link } from "wouter";
import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion, useInView, useScroll, useTransform, useSpring } from "framer-motion";
import { Upload, Eye, CheckCircle, Youtube, Instagram, ArrowRight, ChevronDown, Check, Menu, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { FeatureBento } from "@/components/landing/FeatureBento";
import { InstallButton } from "@/components/pwa/install-button";

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
  "YouTube Publishing", "Instagram Reels", "Role-Based Access",
  "Signed Playback", "No Shared Passwords", "Instant Notifications",
  "Scheduled Posts", "Audit Trail",
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
  { label: "Instant Publish",  urlSlug: "instant-publish",  icon: Send,        title: "Publish to YouTube or Instagram",      subtitle: "After approval, push to your channel or post a Reel—no re-upload." },
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
  { q: "Do I need to share my YouTube or Instagram password with my editor?", a: "Never. MediaLayer uses OAuth — your editor never sees your credentials, and neither do we. You connect your YouTube channel and Instagram account once, and MediaLayer handles publishing on your behalf." },
  { q: "How does the video review process work?", a: "Your editor uploads the finished video directly to MediaLayer. You get notified, watch it securely in the browser (no download needed), then approve or reject with optional feedback." },
  { q: "Is my video stored securely?", a: "Yes. Videos are stored privately on Cloudinary and are never accessible via a public URL. Playback uses signed URLs that expire after 1 hour." },
  { q: "Can I work with multiple editors?", a: "Yes. The Starter plan supports up to 3 editors. The Pro plan supports unlimited editors." },
  { q: "What happens after I approve a video?", a: "You choose the destination — your YouTube channel, or your Instagram account as a Reel or feed post. The video is pushed directly there. Your editor gets notified and can see the resulting link inside the platform." },
  { q: "How does Instagram publishing work?", a: "Connect your Instagram Professional account with Instagram Login — no Facebook Page needed. Once a video is approved, pick Reel or feed post, write your caption, and publish. Instagram pulls the video from a private signed URL, so nothing is ever re-uploaded from your browser." },
  { q: "What kind of Instagram account do I need?", a: "A Professional account — Business or Creator. Personal Instagram accounts cannot publish through the Instagram API. Switching is free and takes about 30 seconds inside the Instagram app." },
  { q: "Can MediaLayer read my DMs, comments, or followers?", a: "No. We request exactly two Instagram permissions: one to read your username and account type so we can show which account you are posting to, and one to publish media you have approved. Messaging, comments, insights, and follower data are never requested." },
  { q: "Can I delete a post after MediaLayer publishes it?", a: "Deleting a published post has to happen inside Instagram or YouTube — those platforms own the post once it is live. You can disconnect your account from MediaLayer at any time, which erases the stored token immediately." },
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

// ── Main page ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.6]);

  const navItems: Array<{ label: string; href: string; route?: boolean; external?: boolean }> = [
    { label: "Features", href: "#features" },
    { label: "Demo",     href: "#demo" },
    { label: "Pricing",  href: "#pricing" },
    { label: "FAQ",      href: "#faq" },
    { label: "Blog",     href: "https://www.notion.so/MediaLayer-Documentation-3332bb9b545a80d8a9dbeff488a8bf79?source=copy_link", external: true },
    { label: "Login",    href: "/login", route: true },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground antialiased" style={{ fontSize: "16px" }}>
      <CursorFollower />

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
              <InstallButton className="h-9 whitespace-nowrap rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" />
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
                      <InstallButton className="h-9 justify-center rounded-md border border-border text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" />
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
                    className="text-[40px] sm:text-[56px] md:text-[72px] lg:text-[80px] font-bold leading-[1.02] text-foreground"
                    style={{ letterSpacing: "-0.03em" }}
                  >
                    The layer that makes
                  </h1>
                </RevealLine>
                <RevealLine delay={0.13}>
                  <h1
                    className="text-[40px] sm:text-[56px] md:text-[72px] lg:text-[80px] font-bold leading-[1.02]"
                    style={{ letterSpacing: "-0.03em", color: P }}
                  >
                    media move.
                  </h1>
                </RevealLine>
              </div>

              <FadeUp delay={0.3}>
                <p className="max-w-md leading-[1.75] mb-8" style={{ color: "#444", fontSize: "16px" }}>
                  Your editor uploads. You review securely. One click publishes to YouTube or Instagram. No downloads, no shared passwords.
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

              {/* Integrations strip */}
              <FadeUp delay={0.45}>
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground whitespace-nowrap opacity-60">Publishes to</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground">
                    <Youtube className="h-3.5 w-3.5" style={{ color: "#FF0000" }} /> YouTube
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground">
                    <Instagram className="h-3.5 w-3.5" style={{ color: "#E1306C" }} /> Instagram
                  </span>
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

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-6 sm:px-8" style={{ background: "#fafafa" }}>
        <div className="max-w-[1100px] mx-auto">
          <p
            className="text-center mb-3 uppercase tracking-[0.2em]"
            style={{ fontSize: "11px", fontWeight: 600, color: "#999" }}
          >
            Features
          </p>
          <div className="text-center mb-4">
            <h2
              className="block leading-[1.1]"
              style={{ fontSize: "clamp(36px, 4vw, 52px)", fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.02em", color: "#111" }}
            >
              Everything you need
            </h2>
            <h2
              className="block leading-[1.1]"
              style={{ fontSize: "clamp(36px, 4vw, 52px)", fontWeight: 700, letterSpacing: "-0.03em", color: "#111" }}
            >
              to manage your workflow
            </h2>
          </div>
          <p
            className="text-center mx-auto mb-12 sm:mb-14"
            style={{ fontSize: "16px", color: "#666", maxWidth: "520px", lineHeight: 1.6 }}
          >
            From secure uploads to direct YouTube and Instagram publishing — MediaLayer handles the entire creator–editor pipeline.
          </p>

          <FeatureBento />
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-32 px-16 bg-background">
        <div className="max-w-[1100px] mx-auto">
          <FadeUp delay={0.05}><H2>Get started in minutes</H2></FadeUp>
          <FadeUp delay={0.1}><Sub>Setting things up is as simple as inviting your editor and connecting YouTube or Instagram. No complex setup or confusing configuration.</Sub></FadeUp>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { num: "01", title: "Invite your editor.", desc: "Share an invite code. Your editor links to your account instantly.", blobs: ["var(--red-3)", "var(--sky-3)"], icon: <img src="/favicon.svg" alt="MediaLayer" className="w-6 h-6 brightness-0 invert" /> },
              { num: "02", title: "Editor uploads.", desc: "Your editor uploads the finished video directly. No file sharing needed.", blobs: ["var(--purple-3)", "var(--green-3)"], icon: <Upload className="w-5 h-5 text-white" /> },
              { num: "03", title: "Review & publish.", desc: "Approve or reject with feedback. One click publishes to YouTube or Instagram.", blobs: ["var(--amber-3)", "var(--purple-3)"], icon: <CheckCircle className="w-5 h-5 text-white" /> },
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

      {/* ── PRODUCT DEMO ── */}
      <section id="demo" className="py-16 px-6 sm:px-8" style={{ background: "#fafafa" }}>
        <div className="max-w-[1100px] mx-auto">
          <FadeUp delay={0.05}>
            <p
              className="text-center mb-3 uppercase tracking-[0.2em]"
              style={{ fontSize: "11px", fontWeight: 600, color: "#999" }}
            >
              Product Demo
            </p>
          </FadeUp>
          <FadeUp delay={0.1}>
            <div className="text-center mb-4">
              <h2
                className="block leading-[1.1]"
                style={{ fontSize: "clamp(36px, 4vw, 52px)", fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.02em", color: "#111" }}
              >
                See it in action
              </h2>
            </div>
          </FadeUp>
          <FadeUp delay={0.15}>
            <p
              className="text-center mx-auto mb-12"
              style={{ fontSize: "16px", color: "#666", maxWidth: "520px", lineHeight: 1.6 }}
            >
              Watch how MediaLayer makes video collaboration effortless — from upload to a published YouTube video or Instagram Reel in a few clicks.
            </p>
          </FadeUp>

          <FadeUp delay={0.2}>
            <div
              className="relative mx-auto rounded-2xl overflow-hidden border border-border"
              style={{
                maxWidth: "900px",
                boxShadow: "0 24px 80px rgba(0,0,0,0.12), 0 8px 24px rgba(145,141,246,0.12)",
              }}
            >
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-[#f5f5f5]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                  <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="rounded-full px-4 py-1 text-xs bg-white border border-border text-muted-foreground min-w-[240px] text-center">
                    medialayer.app
                  </div>
                </div>
              </div>

              {/* Video */}
              <video
                src="/Demo.mp4"
                controls
                playsInline
                preload="metadata"
                className="w-full block bg-black"
                style={{ aspectRatio: "16/9" }}
                aria-label="MediaLayer product demo video"
              />
            </div>
          </FadeUp>

          <FadeUp delay={0.25}>
            <div className="flex justify-center mt-8">
              <Link href="/register">
                <motion.button
                  whileHover={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.15), 0 8px 24px rgba(0,0,0,0.3)" }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-white text-sm font-semibold"
                  style={{ background: "#111" }}
                >
                  Try it yourself <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-32 px-6 sm:px-8 bg-background">
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
                  {["1 creator account", "Up to 3 editors", "Unlimited video reviews", "Direct YouTube publishing", "Instagram Reels & feed posts", "Email notifications", "Lifetime access"].map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-foreground" style={{ fontSize: "14px" }}>
                      <Check className="w-4 h-4 shrink-0" style={{ color: "var(--green-4)" }} /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/login?redirect=/checkout?plan=starter" className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-full border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors">
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
                  {["Unlimited creator accounts", "Unlimited editors", "Unlimited video reviews", "Direct YouTube publishing", "Instagram Reels & feed posts", "Post scheduling", "Priority email support", "Audit logs & analytics", "Lifetime access"].map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-white" style={{ fontSize: "14px" }}>
                      <Check className="w-4 h-4 shrink-0" style={{ color: "rgba(255,255,255,0.7)" }} /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/login?redirect=/checkout?plan=pro" className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-white text-sm font-semibold hover:bg-white/90 transition-colors" style={{ color: P }}>
                  Get started <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </FadeUp>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-6">No subscriptions · No hidden fees · Pay once, own it forever</p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-32 px-6" style={{ background: "#fafafa" }}>
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
              Start reviewing and publishing to YouTube and Instagram today. No downloads, no shared passwords.
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
      <footer className="relative overflow-hidden bg-[#0e0e0e] text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(145,141,246,0.12) 0%, transparent 70%)",
          }}
        />

        <div className="relative mx-auto max-w-[1100px] px-6 pb-10 pt-16 sm:px-8">
          <div className="grid grid-cols-1 gap-12 pb-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-5">
              <Link href="/" className="mb-5 inline-flex items-center gap-3 transition-opacity hover:opacity-90">
                <img
                  src="/logomark-medialayer-02.svg"
                  alt=""
                  className="h-10 w-10 shrink-0"
                />
                <span className="text-lg font-semibold tracking-tight text-white">
                  MediaLayer
                </span>
              </Link>
              <p className="mb-6 max-w-sm text-sm leading-relaxed text-white/50">
                Video collaboration for creators and editors — upload, review, approve, and publish to YouTube and Instagram without the chaos.
              </p>
              <div className="space-y-3">
                <a
                  href="mailto:medialayer.app@gmail.com"
                  className="block text-sm text-white/60 transition-colors hover:text-white"
                >
                  medialayer.app@gmail.com
                </a>
                <a
                  href="https://x.com/MediaLayer67324"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
                >
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-white/5 text-xs font-bold">
                    𝕏
                  </span>
                  @MediaLayer67324
                </a>
              </div>
            </div>

            <div className="lg:col-span-2 lg:col-start-7">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Product</p>
              <ul className="space-y-3 text-sm text-white/50">
                <li><Link href="/login" className="transition-colors hover:text-white">Login</Link></li>
                <li><Link href="/register" className="transition-colors hover:text-white">Register</Link></li>
                <li><a href="#features" className="transition-colors hover:text-white">Features</a></li>
                <li><a href="#pricing" className="transition-colors hover:text-white">Pricing</a></li>
                <li><a href="#faq" className="transition-colors hover:text-white">FAQ</a></li>
              </ul>
            </div>

            <div className="lg:col-span-2">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Platform</p>
              <ul className="space-y-3 text-sm text-white/50">
                <li><span>Secure upload</span></li>
                <li><span>In-browser review</span></li>
                <li><span>YouTube publishing</span></li>
                <li><span>Instagram Reels &amp; posts</span></li>
                <li><span>Role-based access</span></li>
              </ul>
            </div>

            <div className="lg:col-span-3">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Legal</p>
              <ul className="space-y-3 text-sm text-white/50">
                <li><Link href="/privacy" className="transition-colors hover:text-white">Privacy policy</Link></li>
                <li><Link href="/terms" className="transition-colors hover:text-white">Terms of service</Link></li>
                <li><Link href="/data-deletion" className="transition-colors hover:text-white">Data deletion</Link></li>
                <li>
                  <a
                    href="mailto:medialayer.app@gmail.com"
                    className="transition-colors hover:text-white"
                  >
                    Support
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mb-8 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />

          <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
            <p className="text-sm text-white/35">
              © {new Date().getFullYear()} MediaLayer. All rights reserved.
            </p>
            <p className="text-xs text-white/40">
              Made by{" "}
              <a
                href="https://x.com/VPatanvadi89747"
                target="_blank"
                rel="noreferrer"
                className="text-white/55 transition-colors hover:text-white"
              >
                @VPatanvadi89747
              </a>
              {" & "}
              <a
                href="https://x.com/npatanvadiya0"
                target="_blank"
                rel="noreferrer"
                className="text-white/55 transition-colors hover:text-white"
              >
                @npatanvadiya0
              </a>
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
