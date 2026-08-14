import { useState } from "react";
import { Download, Share } from "lucide-react";
import { promptInstall } from "@/lib/pwa";
import { usePwa } from "./use-pwa";

/**
 * Explicit "Install app" affordance for nav/menus. Renders nothing when the app
 * is already installed or the browser can't install it.
 */
export function InstallButton({ className = "" }: { className?: string }) {
  const { canInstall, isStandalone, isIosSafari } = usePwa();
  const [showIosHint, setShowIosHint] = useState(false);

  if (isStandalone || (!canInstall && !isIosSafari)) return null;

  if (showIosHint) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs text-muted-foreground ${className}`}>
        <Share className="size-3.5" />
        Share → Add to Home Screen
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => (canInstall ? promptInstall() : setShowIosHint(true))}
      className={`inline-flex items-center gap-1.5 ${className}`}
    >
      <Download className="size-4" />
      Install app
    </button>
  );
}
