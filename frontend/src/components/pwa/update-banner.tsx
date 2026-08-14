import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { applyUpdate } from "@/lib/pwa";
import { usePwa } from "./use-pwa";

/** Offers a reload when a newer build has been downloaded in the background. */
export function UpdateBanner() {
  const { updateReady } = usePwa();
  const [dismissed, setDismissed] = useState(false);
  const [updating, setUpdating] = useState(false);

  return (
    <AnimatePresence>
      {updateReady && !dismissed && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-[100] sm:left-6"
        >
          <div className="flex items-center gap-3 rounded-full border border-border bg-background/95 py-2 pl-4 pr-2 shadow-[var(--shadow-3)] backdrop-blur-xl">
            <span className="text-sm text-foreground">New version available</span>
            <button
              type="button"
              onClick={() => {
                setUpdating(true);
                applyUpdate();
              }}
              disabled={updating}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#111] px-3.5 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              <RefreshCw className={`size-3.5 ${updating ? "animate-spin" : ""}`} />
              {updating ? "Updating" : "Update"}
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="pr-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Later
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
