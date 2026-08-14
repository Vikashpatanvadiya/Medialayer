import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Share, Plus, Download } from "lucide-react";
import { promptInstall } from "@/lib/pwa";
import { usePwa } from "./use-pwa";

const DISMISS_KEY = "medialayer:install-dismissed-at";
const DISMISS_DAYS = 30;
const SHOW_DELAY_MS = 6000;

function dismissedRecently(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    return Boolean(at) && Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function rememberDismissal() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    /* private mode — the prompt simply reappears next visit */
  }
}

/**
 * Bottom install card. Uses the native Chromium prompt where it exists and
 * falls back to Add-to-Home-Screen instructions on iOS Safari.
 */
export function InstallPrompt() {
  const { canInstall, isStandalone, isIosSafari, updateReady } = usePwa();
  const [visible, setVisible] = useState(false);
  const [showIosSteps, setShowIosSteps] = useState(false);

  // One bottom overlay at a time — an available update is the more urgent one.
  const eligible =
    !isStandalone && !updateReady && (canInstall || isIosSafari) && !dismissedRecently();

  useEffect(() => {
    if (!eligible) {
      setVisible(false);
      return;
    }
    // Let people see the page before asking for anything.
    const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [eligible]);

  const close = () => {
    setVisible(false);
    setShowIosSteps(false);
    rememberDismissal();
  };

  const install = async () => {
    if (canInstall) {
      const accepted = await promptInstall();
      if (accepted) setVisible(false);
      else close();
      return;
    }
    setShowIosSteps(true);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="dialog"
          aria-label="Install MediaLayer"
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-0 bottom-0 z-[100] flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:inset-x-auto sm:right-6 sm:justify-end"
        >
          <div className="w-full max-w-[26rem] rounded-[var(--radius-6)] border border-border bg-background/95 p-4 shadow-[var(--shadow-4)] backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <img
                src="/icons/icon-192.png"
                alt=""
                width={44}
                height={44}
                className="size-11 shrink-0 rounded-[12px]"
              />

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">Install MediaLayer</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {showIosSteps
                    ? "Add MediaLayer to your Home Screen in two taps."
                    : "Full-screen app, home-screen icon, and instant launches."}
                </p>
              </div>

              <button
                type="button"
                onClick={close}
                aria-label="Dismiss"
                className="-mr-1 -mt-1 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {showIosSteps ? (
              <ol className="mt-3.5 space-y-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-2.5 rounded-[var(--radius-4)] bg-muted/60 px-3 py-2">
                  <Share className="size-4 shrink-0 text-foreground" />
                  <span>
                    Tap <span className="font-medium text-foreground">Share</span> in the Safari
                    toolbar
                  </span>
                </li>
                <li className="flex items-center gap-2.5 rounded-[var(--radius-4)] bg-muted/60 px-3 py-2">
                  <Plus className="size-4 shrink-0 text-foreground" />
                  <span>
                    Choose{" "}
                    <span className="font-medium text-foreground">Add to Home Screen</span>
                  </span>
                </li>
              </ol>
            ) : (
              <div className="mt-3.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={install}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#111] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  <Download className="size-4" />
                  Install app
                </button>
                <button
                  type="button"
                  onClick={close}
                  className="rounded-full px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  Not now
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
