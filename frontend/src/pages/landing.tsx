import { Link } from "wouter";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { useRef } from "react";

/* ─── tiny inline helpers ─────────────────────────────────────────── */

const STEPS = [
  { n: "01", title: "Editor uploads", body: "Drag-and-drop a video. It lands in the creator's review queue instantly — no Drive links, no DMs." },
  { n: "02", title: "Creator reviews", body: "Watch the video right in the platform. Approve with one click or send timestamped feedback." },
  { n: "03", title: "Publish to YouTube", body: "Approved? Hit upload. MediaLayer pushes it straight to the connected YouTube channel." },
];

const ROLES = [
  {
    tag: "For Creators",
    headline: "Your inbox, not your DMs.",
    body: "Every video your editors submit lands in a clean review queue. Approve, reject with notes, or push live — all without leaving the platform.",
    cta: "Start as Creator",
    href: "/register?role=creator",
    accent: "#f59e0b",
  },
  {
    tag: "For Editors",
    headline: "Submit once. Done.",
    body: "Upload your cut, add a description and tags, pick the creator — and you're done. No chasing replies, no version confusion.",
    cta: "Start as Editor",
    href: "/register?role=editor",
    accent: "#6366f1",
  },
];

/* ─── film-strip ticker ────────────────────────────────────────────── */
const TICKER_ITEMS = [
  "Upload", "Review", "Approve", "Publish", "Collaborate",
  "Upload", "Review", "Approve", "Publish", "Collaborate",
];

function Ticker() {
  return (
    <div className="overflow-hidden border-y border-[#ffffff0f] py-3 select-none">
      <motion.div
        className="flex gap-10 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 18, ease: "linear", repeat: Infinity }}
      >
        {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
          <span key={i} className="text-xs font-semibold tracking-[0.25em] uppercase text-[#ffffff22] flex items-center gap-10">
            {item}
            <span className="w-1 h-1 rounded-full bg-[#f59e0b44] inline-block" />
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ─── main component ───────────────────────────────────────────────── */
export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <div
      className="min-h-screen overflow-hidden"
      style={{
        background: "#0a0a0f",
        color: "#e8e6e0",
        fontFamily: "'DM Sans', 'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=DM+Serif+Display:ital@0;1&display=swap');
        .font-serif-display { font-family: 'DM Serif Display', Georgia, serif; }
        .font-dm { font-family: 'DM Sans', sans-serif; }
        @keyframes grain {
          0%, 100% { transform: translate(0,0) }
          10% { transform: translate(-2%,-3%) }
          20% { transform: translate(3%,2%) }
          30% { transform: translate(-1%,4%) }
          40% { transform: translate(4%,-1%) }
          50% { transform: translate(-3%,3%) }
          60% { transform: translate(2%,-4%) }
          70% { transform: translate(-4%,1%) }
          80% { transform: translate(1%,3%) }
          90% { transform: translate(3%,-2%) }
        }
        .grain::after {
          content: '';
          position: fixed;
          inset: -200%;
          width: 400%;
          height: 400%;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          opacity: 0.025;
          pointer-events: none;
          z-index: 9999;
          animation: grain 0.5s steps(1) infinite;
        }
        .amber-glow { box-shadow: 0 0 60px 0 #f59e0b22, 0 0 120px 0 #f59e0b0a; }
        .indigo-glow { box-shadow: 0 0 60px 0 #6366f122, 0 0 120px 0 #6366f10a; }
        .step-line::before {
          content: '';
          position: absolute;
          left: 1.25rem;
          top: 3rem;
          bottom: -1rem;
          width: 1px;
          background: linear-gradient(to bottom, #f59e0b44, transparent);
        }
      `}</style>

      {/* Grain overlay */}
      <div className="grain" />

      {/* ── NAV ── */}
      <nav
        style={{ borderBottom: "1px solid #ffffff0a" }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl"
      >
        <div
          style={{ background: "linear-gradient(to bottom, #0a0a0fcc, transparent)" }}
          className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <img
              src={`${import.meta.env.BASE_URL}images/logo.png`}
              alt="MediaLayer"
              className="w-8 h-8 rounded-md object-contain bg-white/10 p-0.5"
            />
            <span className="font-dm font-semibold text-base tracking-tight text-white">MediaLayer</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm font-dm text-white/40 hover:text-white/80 transition-colors hidden sm:block">
              Sign in
            </Link>
            <Link
              href="/register"
              className="font-dm text-sm font-medium px-4 py-2 rounded-full transition-all"
              style={{ background: "#f59e0b", color: "#0a0a0f" }}
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col justify-center pt-16 overflow-hidden">

        {/* Background radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 50% 0%, #f59e0b08 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 80%, #6366f108 0%, transparent 60%)",
          }}
        />

        {/* Vertical film-strip lines */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[15, 35, 65, 85].map((pct) => (
            <div
              key={pct}
              className="absolute top-0 bottom-0 w-px"
              style={{ left: `${pct}%`, background: "linear-gradient(to bottom, transparent, #ffffff06 30%, #ffffff06 70%, transparent)" }}
            />
          ))}
        </div>

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-32"
        >
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 mb-10"
          >
            <span
              className="w-6 h-px"
              style={{ background: "#f59e0b" }}
            />
            <span className="font-dm text-xs font-medium tracking-[0.2em] uppercase" style={{ color: "#f59e0b" }}>
              Video collaboration, reimagined
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-serif-display leading-[0.95] mb-8"
            style={{ fontSize: "clamp(3.5rem, 10vw, 8rem)", color: "#f5f0e8", letterSpacing: "-0.02em" }}
          >
            From cut<br />
            <em style={{ color: "#f59e0b", fontStyle: "italic" }}>to published.</em>
          </motion.h1>

          {/* Sub + CTA row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="flex flex-col lg:flex-row lg:items-end gap-8 lg:gap-16"
          >
            <p
              className="font-dm text-lg leading-relaxed max-w-md"
              style={{ color: "#ffffff66", fontWeight: 300 }}
            >
              MediaLayer is the workspace where YouTube creators and their editors close the loop — upload, review, approve, publish.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Link
                href="/register?role=creator"
                className="group font-dm font-medium text-sm px-6 py-3.5 rounded-full flex items-center gap-2 transition-all"
                style={{ background: "#f59e0b", color: "#0a0a0f" }}
              >
                I'm a Creator
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/register?role=editor"
                className="font-dm font-medium text-sm px-6 py-3.5 rounded-full flex items-center gap-2 transition-all"
                style={{ border: "1px solid #ffffff18", color: "#ffffff99", background: "transparent" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#ffffff33"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#ffffff18"; (e.currentTarget as HTMLElement).style.color = "#ffffff99"; }}
              >
                I'm an Editor
              </Link>
            </div>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex gap-10 mt-16 pt-10"
            style={{ borderTop: "1px solid #ffffff0a" }}
          >
            {[
              { val: "1-click", label: "approvals" },
              { val: "Direct", label: "YouTube upload" },
              { val: "Zero", label: "email threads" },
            ].map(({ val, label }) => (
              <div key={label}>
                <p className="font-serif-display text-2xl" style={{ color: "#f5f0e8" }}>{val}</p>
                <p className="font-dm text-xs mt-0.5" style={{ color: "#ffffff44", letterSpacing: "0.08em" }}>{label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="w-px h-10"
            style={{ background: "linear-gradient(to bottom, #ffffff33, transparent)" }}
          />
        </motion.div>
      </section>

      {/* ── TICKER ── */}
      <Ticker />

      {/* ── HOW IT WORKS ── */}
      <section className="py-32 px-6 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <p className="font-dm text-xs font-medium tracking-[0.2em] uppercase mb-4" style={{ color: "#f59e0b" }}>
            How it works
          </p>
          <h2 className="font-serif-display" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", color: "#f5f0e8", lineHeight: 1.05 }}>
            Three steps.<br /><em style={{ color: "#ffffff55" }}>That's it.</em>
          </h2>
        </motion.div>

        <div className="space-y-0">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative step-line last:before:hidden grid grid-cols-[3rem_1fr] gap-8 pb-12 last:pb-0"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-dm text-xs font-semibold"
                style={{ border: "1px solid #f59e0b44", color: "#f59e0b", background: "#f59e0b0a" }}
              >
                {step.n}
              </div>
              <div className="pt-1.5">
                <h3 className="font-dm font-semibold text-lg mb-2" style={{ color: "#f5f0e8" }}>{step.title}</h3>
                <p className="font-dm text-sm leading-relaxed" style={{ color: "#ffffff55", fontWeight: 300 }}>{step.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── ROLE CARDS ── */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-4">
          {ROLES.map((role, i) => (
            <motion.div
              key={role.tag}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative rounded-2xl p-8 overflow-hidden group"
              style={{ border: `1px solid ${role.accent}18`, background: `${role.accent}06` }}
            >
              {/* Corner glow */}
              <div
                className="absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity"
                style={{ background: role.accent }}
              />

              <p
                className="font-dm text-xs font-semibold tracking-[0.15em] uppercase mb-6"
                style={{ color: role.accent }}
              >
                {role.tag}
              </p>
              <h3
                className="font-serif-display mb-4"
                style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "#f5f0e8", lineHeight: 1.1 }}
              >
                {role.headline}
              </h3>
              <p
                className="font-dm text-sm leading-relaxed mb-8"
                style={{ color: "#ffffff55", fontWeight: 300 }}
              >
                {role.body}
              </p>
              <Link
                href={role.href}
                className="inline-flex items-center gap-2 font-dm text-sm font-medium px-5 py-2.5 rounded-full transition-all"
                style={{ background: role.accent, color: "#0a0a0f" }}
              >
                {role.cta}
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FEATURES STRIP ── */}
      <section className="py-24 px-6">
        <div
          className="max-w-6xl mx-auto rounded-2xl p-10 md:p-16 grid md:grid-cols-3 gap-10"
          style={{ border: "1px solid #ffffff08", background: "#ffffff03" }}
        >
          {[
            { icon: "⚡", title: "No more Drive links", body: "Editors submit directly. Creators review directly. No middleman, no lost files." },
            { icon: "✓", title: "Feedback that sticks", body: "Reject with written notes. The editor sees exactly what to fix, no ambiguity." },
            { icon: "▶", title: "One-click to YouTube", body: "Approved videos go straight to the connected channel. No re-uploading, no re-tagging." },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <span className="text-2xl mb-5 block" style={{ filter: "grayscale(0.3)" }}>{f.icon}</span>
              <h4 className="font-dm font-semibold mb-2" style={{ color: "#f5f0e8" }}>{f.title}</h4>
              <p className="font-dm text-sm leading-relaxed" style={{ color: "#ffffff44", fontWeight: 300 }}>{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-24 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <p className="font-dm text-xs font-medium tracking-[0.2em] uppercase mb-6" style={{ color: "#f59e0b" }}>
            Ready?
          </p>
          <h2
            className="font-serif-display mb-8"
            style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)", color: "#f5f0e8", lineHeight: 1, letterSpacing: "-0.02em" }}
          >
            Stop managing videos<br />
            <em style={{ color: "#f59e0b" }}>in your DMs.</em>
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register?role=creator"
              className="group font-dm font-medium text-sm px-8 py-4 rounded-full flex items-center gap-2 transition-all amber-glow"
              style={{ background: "#f59e0b", color: "#0a0a0f" }}
            >
              Start as Creator
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/register?role=editor"
              className="font-dm font-medium text-sm px-8 py-4 rounded-full transition-all"
              style={{ border: "1px solid #ffffff18", color: "#ffffff77" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#fff"; (e.currentTarget as HTMLElement).style.borderColor = "#ffffff33"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#ffffff77"; (e.currentTarget as HTMLElement).style.borderColor = "#ffffff18"; }}
            >
              Start as Editor
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        className="py-8 px-6"
        style={{ borderTop: "1px solid #ffffff08" }}
      >
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img
              src={`${import.meta.env.BASE_URL}images/logo.png`}
              alt="MediaLayer"
              className="w-6 h-6 rounded object-contain bg-white/10 p-0.5 opacity-60"
            />
            <span className="font-dm text-xs" style={{ color: "#ffffff33" }}>© 2026 MediaLayer</span>
          </div>
          <div className="flex items-center gap-6">
            {[
              { label: "Privacy", href: "/privacy" },
              { label: "Terms", href: "/terms" },
              { label: "Contact", href: "mailto:medialayer.app@gmail.com" },
            ].map(({ label, href }) => (
              href.startsWith("mailto") ? (
                <a key={label} href={href} className="font-dm text-xs transition-colors" style={{ color: "#ffffff33" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#ffffff88")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#ffffff33")}
                >{label}</a>
              ) : (
                <Link key={label} href={href} className="font-dm text-xs transition-colors" style={{ color: "#ffffff33" }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#ffffff88")}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "#ffffff33")}
                >{label}</Link>
              )
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
