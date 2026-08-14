import { useEffect } from "react";
import { InstallPrompt } from "./install-prompt";
import { UpdateBanner } from "./update-banner";
import { OfflineIndicator } from "./offline-indicator";
import { usePwa } from "./use-pwa";

/**
 * Mounts every PWA surface and applies the standalone behaviours that make the
 * installed app behave like a native one. Render once, near the app root.
 */
export function PwaManager() {
  const { isStandalone } = usePwa();

  // Lets CSS target the installed app (safe areas, no-bounce, hidden web-only UI).
  useEffect(() => {
    document.documentElement.dataset.standalone = String(isStandalone);
  }, [isStandalone]);

  // In a standalone window an external link would replace the app with a
  // chrome-less page the user can't navigate back from — send those to the browser.
  useEffect(() => {
    if (!isStandalone) return;

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey) return;
      const anchor = (event.target as HTMLElement | null)?.closest?.("a");
      if (!anchor || anchor.target || anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin === window.location.origin) return;
      if (url.protocol !== "http:" && url.protocol !== "https:") return;

      event.preventDefault();
      window.open(url.href, "_blank", "noopener,noreferrer");
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [isStandalone]);

  return (
    <>
      <OfflineIndicator />
      <UpdateBanner />
      <InstallPrompt />
    </>
  );
}
