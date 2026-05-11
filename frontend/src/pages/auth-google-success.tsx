import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { apiUrl } from "@/lib/api";

export default function GoogleAuthSuccess() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const role = params.get("role");

    if (!token) {
      setLocation("/login?error=google_failed");
      return;
    }

    localStorage.setItem("layer_token", token);

    // Activate any pending Solana payment before redirecting
    const PENDING_PAYMENT_KEY = "layer_pending_payment";
    const pending = localStorage.getItem(PENDING_PAYMENT_KEY);

    // Fetch user and redirect
    fetch(apiUrl("/api/auth/me"), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(async user => {
        queryClient.setQueryData(["/api/auth/me"], user);
        // Activate pending payment if exists
        if (pending) {
          try {
            const { txSignature, plan, walletAddress } = JSON.parse(pending);
            if (txSignature && plan) {
              localStorage.removeItem(PENDING_PAYMENT_KEY);
              await fetch(apiUrl("/api/payments/verify-plan"), {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ txSignature, plan, walletAddress }),
              });
              queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
            }
          } catch {}
        }
        setLocation(user.role === "creator" ? "/dashboard/creator" : "/dashboard/editor");
      })
      .catch(() => setLocation("/login"));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  );
}
