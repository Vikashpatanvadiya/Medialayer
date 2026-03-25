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

    // Fetch user and redirect
    fetch(apiUrl("/api/auth/me"), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(user => {
        queryClient.setQueryData(["/api/auth/me"], user);
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
