import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CloudOff, Check } from "lucide-react";
import { useOnline } from "./use-pwa";

/** Native-app-style connection pill: shows while offline, confirms on reconnect. */
export function OfflineIndicator() {
  const online = useOnline();
  const [wasOffline, setWasOffline] = useState(false);
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    if (!online) {
      setWasOffline(true);
      setShowRestored(false);
      return;
    }
    if (!wasOffline) return;
    setShowRestored(true);
    const timer = setTimeout(() => {
      setShowRestored(false);
      setWasOffline(false);
    }, 2400);
    return () => clearTimeout(timer);
  }, [online, wasOffline]);

  const visible = !online || showRestored;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-[110] flex justify-center px-4"
        >
          <div
            className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium shadow-[var(--shadow-2)] backdrop-blur-xl ${
              online
                ? "border-[var(--green-2)] bg-[var(--green-1)] text-[var(--green-4)]"
                : "border-border bg-background/95 text-foreground"
            }`}
          >
            {online ? <Check className="size-3.5" /> : <CloudOff className="size-3.5" />}
            {online ? "Back online" : "You're offline"}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
