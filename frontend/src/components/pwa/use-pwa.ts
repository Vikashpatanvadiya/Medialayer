import { useEffect, useState, useSyncExternalStore } from "react";
import { getPwaState, setInstallSuppressed, subscribeToPwa, type PwaState } from "@/lib/pwa";

/** Live PWA install / update / display-mode state. */
export function usePwa(): PwaState {
  return useSyncExternalStore(subscribeToPwa, getPwaState, getPwaState);
}

/** Hides the install card while this component is mounted. */
export function useHideInstallPrompt(): void {
  useEffect(() => {
    setInstallSuppressed(true);
    return () => setInstallSuppressed(false);
  }, []);
}

/** `navigator.onLine`, kept in sync with the online/offline events. */
export function useOnline(): boolean {
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return online;
}
