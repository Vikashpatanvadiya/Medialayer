import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiUrl } from "@/lib/api";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Min 6 characters"),
});

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const { login, isLoggingIn } = useAuth();
  const { toast } = useToast();
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const justVerified = params.get("verified") === "1";
  const verifiedEmail = params.get("email") || "";
  const redirect = params.get("redirect") || "";
  const fromPricing = redirect.includes("/checkout");
  const googleError = params.get("error");

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: verifiedEmail, password: "" },
  });

  const handleResend = async () => {
    if (!unverifiedEmail) return;
    setIsResending(true);
    try {
      const res = await fetch(apiUrl("/api/auth/resend-verification"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: unverifiedEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) toast({ title: "Email sent", description: data.message || "Check your inbox." });
      else toast({ title: "Error", description: data.error, variant: "destructive" });
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit(async (d) => {
        try {
          setUnverifiedEmail(null);
          await login(d);
        } catch (err: any) {
          const msg: string = err?.data?.error || err?.message || "";
          if (msg.toLowerCase().includes("verify your email")) setUnverifiedEmail(d.email);
        }
      })}>
        <FieldGroup>
          {/* Logo + heading */}
          <div className="flex flex-col items-center gap-2 text-center">
            <Link href="/" className="flex flex-col items-center gap-2">
              <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="MediaLayer" className="size-8 object-contain" />
            </Link>
            <h1 className="text-xl font-bold tracking-tight">Welcome back</h1>
            <FieldDescription>
              Don't have an account?{" "}
              <Link href="/register" className="underline underline-offset-4 hover:text-foreground font-medium">Sign up</Link>
            </FieldDescription>
          </div>

          {justVerified && (
            <div className="flex items-start gap-2 rounded-[var(--radius-4)] border p-3 text-sm"
              style={{ background: "var(--green-1)", borderColor: "var(--green-2)", color: "var(--green-4)" }}>
              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
              Email verified. Enter your password to sign in.
            </div>
          )}

          {googleError === "no_account" && (
            <div className="flex items-start gap-2 rounded-[var(--radius-4)] border p-3 text-sm"
              style={{ background: "var(--amber-1)", borderColor: "var(--amber-2)", color: "var(--amber-4)" }}>
              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>No account found for that Google address.{" "}
                <Link href="/register" className="font-semibold underline">Sign up</Link> first.
              </span>
            </div>
          )}

          {fromPricing && !justVerified && (
            <div className="flex items-start gap-2 rounded-[var(--radius-4)] border p-3 text-sm"
              style={{ background: "var(--purple-1)", borderColor: "var(--purple-2)", color: "var(--purple-4)" }}>
              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>Sign in to continue to checkout. Don't have an account?{" "}
                <Link href={`/register?redirect=${encodeURIComponent(redirect)}`} className="font-semibold underline">Sign up</Link>
              </span>
            </div>
          )}

          <Field>
            <FieldLabel htmlFor="email">Work email</FieldLabel>
            <Input id="email" type="email" placeholder="name@company.com" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
          </Field>

          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
            {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
          </Field>

          <Field>
            <Button type="submit" className="w-full" disabled={isLoggingIn}>
              {isLoggingIn ? <Loader2 className="size-4 animate-spin" /> : "Sign in"}
            </Button>
          </Field>

          {unverifiedEmail && (
            <div className="rounded-[var(--radius-4)] border p-3 text-sm"
              style={{ background: "var(--amber-1)", borderColor: "var(--amber-2)", color: "var(--amber-4)" }}>
              <p className="mb-1">Didn't receive the verification email?</p>
              <button type="button" onClick={handleResend} disabled={isResending}
                className="font-semibold underline hover:no-underline disabled:opacity-50 flex items-center gap-1">
                {isResending && <Loader2 className="w-3 h-3 animate-spin" />}
                Resend verification email
              </button>
            </div>
          )}

          <FieldSeparator>Or</FieldSeparator>

          <Field>
            <Button variant="outline" type="button" className="w-full" asChild>
              <a href={apiUrl("/api/auth/google?role=login")}>
                <GoogleIcon /> Continue with Google
              </a>
            </Button>
          </Field>
        </FieldGroup>
      </form>

      <FieldDescription className="px-6 text-center">
        By signing in, you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">Terms</Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">Privacy Policy</Link>.
      </FieldDescription>
    </div>
  );
}
