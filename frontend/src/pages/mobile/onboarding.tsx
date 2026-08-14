import { useState } from "react";
import { useLocation } from "wouter";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { ArrowRight, Upload, ShieldCheck, Youtube } from "lucide-react";
import { useHideInstallPrompt } from "@/components/pwa/use-pwa";

const ONBOARDED_KEY = "medialayer:onboarded";

export function markOnboarded() {
  try {
    localStorage.setItem(ONBOARDED_KEY, "1");
  } catch {
    /* private mode — onboarding simply shows again */
  }
}

export function hasOnboarded(): boolean {
  try {
    return localStorage.getItem(ONBOARDED_KEY) === "1";
  } catch {
    return false;
  }
}

const PURPLE = "var(--purple-4)";

const slides = [
  {
    key: "welcome",
    eyebrow: "Welcome to MediaLayer",
    title: "The layer that makes media move.",
    body: "One workspace where your editor delivers and you approve — no Drive links, no shared passwords.",
    visual: (
      <div
        className="w-full overflow-hidden rounded-[1.75rem] border border-border/70 shadow-[var(--shadow-3)]"
        style={{ background: "linear-gradient(160deg, var(--purple-1), var(--bg-2))" }}
      >
        <img src="/hero_image.png" alt="" className="w-full mix-blend-multiply" />
      </div>
    ),
  },
  {
    key: "upload",
    eyebrow: "Step one",
    title: "Your editor uploads.",
    body: "Finished cuts land straight in your workspace, versioned and ready to watch.",
    visual: <GlyphVisual icon={Upload} />,
  },
  {
    key: "review",
    eyebrow: "Step two",
    title: "You review, securely.",
    body: "Signed playback in the browser. Approve or send notes without downloading a thing.",
    visual: <GlyphVisual icon={ShieldCheck} />,
  },
  {
    key: "publish",
    eyebrow: "Step three",
    title: "One tap to YouTube.",
    body: "Approved videos publish straight to your channel. Your credentials never leave you.",
    visual: <GlyphVisual icon={Youtube} />,
  },
];

function GlyphVisual({ icon: Icon }: { icon: typeof Upload }) {
  return (
    <div className="relative flex items-center justify-center">
      <div
        className="absolute size-56 rounded-full blur-3xl"
        style={{ background: "var(--purple-2)", opacity: 0.7 }}
      />
      <div
        className="relative flex size-28 items-center justify-center rounded-[2rem] shadow-[var(--shadow-3)]"
        style={{ background: PURPLE }}
      >
        <Icon className="size-12 text-white" strokeWidth={1.6} />
      </div>
    </div>
  );
}

/** Full-screen, swipeable first-run experience shown instead of the website. */
export default function MobileOnboarding() {
  const [, setLocation] = useLocation();
  const [[index, direction], setPage] = useState<[number, number]>([0, 0]);
  useHideInstallPrompt();
  const slide = slides[index];
  const isLast = index === slides.length - 1;

  const paginate = (delta: number) => {
    const next = index + delta;
    if (next < 0 || next >= slides.length) return;
    setPage([next, delta]);
  };

  const go = (path: string) => {
    markOnboarded();
    setLocation(path);
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const swipe = info.offset.x;
    if (swipe < -60) paginate(1);
    else if (swipe > 60) paginate(-1);
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-background text-foreground select-none">
      {/* Top bar */}
      <div className="flex shrink-0 items-center justify-between px-5 pt-[max(1rem,env(safe-area-inset-top))]">
        <img src="/favicon.svg" alt="MediaLayer" className="h-5 w-5" />
        <button
          type="button"
          onClick={() => go("/register")}
          className="rounded-full px-2 py-1 text-sm font-medium text-muted-foreground"
        >
          Skip
        </button>
      </div>

      {/* Slide */}
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={slide.key}
            custom={direction}
            initial={{ opacity: 0, x: direction >= 0 ? 40 : -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction >= 0 ? -40 : 40 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            onDragEnd={onDragEnd}
            className="absolute inset-0 flex flex-col px-6"
          >
            <div className="flex flex-1 items-center justify-center overflow-hidden py-4">
              {slide.visual}
            </div>

            <div className="shrink-0 pb-2">
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.18em]"
                style={{ color: PURPLE }}
              >
                {slide.eyebrow}
              </p>
              <h1
                className="mt-3 text-[30px] font-bold leading-[1.1]"
                style={{ letterSpacing: "-0.03em" }}
              >
                {slide.title}
              </h1>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                {slide.body}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="shrink-0 px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5">
        <div className="mb-5 flex items-center gap-1.5" aria-hidden="true">
          {slides.map((s, i) => (
            <span
              key={s.key}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === index ? 22 : 6,
                background: i === index ? PURPLE : "var(--gray-2)",
              }}
            />
          ))}
        </div>

        {isLast ? (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => go("/register")}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#111] py-4 text-[15px] font-semibold text-white active:scale-[0.99] transition-transform"
            >
              Create free account
              <ArrowRight className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => go("/login")}
              className="w-full py-3 text-[15px] font-medium text-muted-foreground"
            >
              I already have an account
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => go("/login")}
              className="py-4 pr-2 text-[15px] font-medium text-muted-foreground"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => paginate(1)}
              className="ml-auto flex items-center justify-center gap-2 rounded-full bg-[#111] px-7 py-4 text-[15px] font-semibold text-white active:scale-[0.99] transition-transform"
            >
              Next
              <ArrowRight className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
