/**
 * PWA runtime: service-worker registration, update detection, and a tiny store
 * for the deferred install prompt so any component can trigger installation.
 */

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

type Listener = () => void;

export interface PwaState {
  /** Chromium fired beforeinstallprompt — a real install dialog is available. */
  canInstall: boolean;
  /** Running from the home screen / app window rather than a browser tab. */
  isStandalone: boolean;
  /** iOS Safari never fires beforeinstallprompt; it needs manual instructions. */
  isIosSafari: boolean;
  /** A new service worker is waiting to take over. */
  updateReady: boolean;
}

const listeners = new Set<Listener>();
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let waitingWorker: ServiceWorker | null = null;

let state: PwaState = {
  canInstall: false,
  isStandalone: detectStandalone(),
  isIosSafari: detectIosSafari(),
  updateReady: false,
};

function detectStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    // iOS Safari's non-standard flag.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function detectIosSafari(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isIos =
    /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS 13+ reports as a Mac; touch points give it away.
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (!isIos) return false;
  // Chrome/Firefox/Edge on iOS can't add to the home screen at all.
  return !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
}

function setState(patch: Partial<PwaState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

export function getPwaState(): PwaState {
  return state;
}

export function subscribeToPwa(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Opens the native install dialog. Resolves true when the user accepted. */
export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) return false;
  const event = deferredPrompt;
  await event.prompt();
  const { outcome } = await event.userChoice;
  // A prompt event can only be used once.
  deferredPrompt = null;
  setState({ canInstall: false });
  return outcome === "accepted";
}

/** Activates the waiting service worker; the page reloads once it takes over. */
export function applyUpdate(): void {
  if (!waitingWorker) {
    window.location.reload();
    return;
  }
  waitingWorker.postMessage("SKIP_WAITING");
}

export function initPwa(): void {
  if (typeof window === "undefined") return;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    setState({ canInstall: true });
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    setState({ canInstall: false, isStandalone: true });
  });

  const standaloneQuery = window.matchMedia("(display-mode: standalone)");
  standaloneQuery.addEventListener("change", () => {
    setState({ isStandalone: detectStandalone() });
  });

  if (!("serviceWorker" in navigator)) return;

  if (import.meta.env.DEV) {
    // Vite serves modules unbundled in dev; a stale SW would only get in the way.
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    });
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        const track = (worker: ServiceWorker | null) => {
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            // "installed" with an existing controller means an update is ready.
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              waitingWorker = worker;
              setState({ updateReady: true });
            }
          });
        };

        if (registration.waiting && navigator.serviceWorker.controller) {
          waitingWorker = registration.waiting;
          setState({ updateReady: true });
        }
        registration.addEventListener("updatefound", () => track(registration.installing));

        // Pick up deploys without waiting for a full browser restart.
        setInterval(() => registration.update().catch(() => {}), 60 * 60 * 1000);
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") registration.update().catch(() => {});
        });
      })
      .catch(() => {
        /* Registration failures must never break the app. */
      });

    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  });
}
