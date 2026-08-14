import { useEffect, useState } from "react";

const MOBILE_QUERY = "(max-width: 767px)";
const FORCE_SITE_KEY = "medialayer:force-site";

/** Search engines must still see the marketing landing page. */
export function isCrawler(): boolean {
  if (typeof navigator === "undefined") return false;
  return /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora link preview|pinterest|whatsapp|telegram|lighthouse|headlesschrome/i.test(
    navigator.userAgent,
  );
}

/** `?site=1` lets a phone opt out of the app shell and browse the full site. */
function forcedSite(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (new URLSearchParams(window.location.search).get("site") === "1") {
      sessionStorage.setItem(FORCE_SITE_KEY, "1");
      return true;
    }
    return sessionStorage.getItem(FORCE_SITE_KEY) === "1";
  } catch {
    return false;
  }
}

export function clearForcedSite() {
  try {
    sessionStorage.removeItem(FORCE_SITE_KEY);
  } catch {
    /* ignore */
  }
}

function evaluate(): boolean {
  if (typeof window === "undefined") return false;
  if (isCrawler() || forcedSite()) return false;
  return window.matchMedia(MOBILE_QUERY).matches;
}

/**
 * True when MediaLayer should present itself as a phone app — onboarding,
 * bottom tab bar, no marketing pages — rather than as a website.
 * Evaluated synchronously so the landing page never flashes first.
 */
export function useMobileApp(): boolean {
  const [mobileApp, setMobileApp] = useState(evaluate);

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    const onChange = () => setMobileApp(evaluate());
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return mobileApp;
}
