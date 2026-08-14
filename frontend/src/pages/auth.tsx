import { Link } from "wouter";
import { ChevronLeft } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { SignupForm } from "@/components/signup-form";
import { useMobileApp } from "@/hooks/use-mobile-app";
import { useHideInstallPrompt } from "@/components/pwa/use-pwa";

export default function AuthPage({ mode = "login" }: { mode?: "login" | "register" }) {
  const isLogin = mode === "login";
  const mobileApp = useMobileApp();
  const form = isLogin ? <LoginForm /> : <SignupForm />;
  useHideInstallPrompt();

  // Phone: a full-screen app screen with its own nav, not a centered web card.
  if (mobileApp) {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-background">
        <header className="flex shrink-0 items-center gap-1 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <Link
            href="/"
            aria-label="Back"
            className="flex size-9 items-center justify-center rounded-full active:bg-muted"
          >
            <ChevronLeft className="size-5" />
          </Link>
          <img src="/favicon.svg" alt="MediaLayer" className="size-5" />
        </header>

        <div className="flex flex-1 flex-col justify-center px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
          <div className="w-full">{form}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">{form}</div>
    </div>
  );
}
