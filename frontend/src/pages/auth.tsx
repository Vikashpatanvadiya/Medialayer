import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { apiUrl } from "@/lib/api";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = loginSchema.extend({
  name: z.string().min(2, "Name is required"),
  role: z.enum(["creator", "editor"]),
});

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

// Role picker modal before Google OAuth
function GoogleRolePicker({ onSelect, onClose }: { onSelect: (role: "creator" | "editor") => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-card rounded-3xl shadow-2xl border border-border/50 w-full max-w-sm p-8"
      >
        <h2 className="text-xl font-bold mb-2 text-center">I am a...</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">Choose your role to continue with Google</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onSelect("creator")}
            className="border rounded-xl p-5 flex flex-col items-center gap-2 hover:border-primary hover:bg-primary/5 transition-all"
          >
            <span className="text-2xl">🎬</span>
            <span className="font-semibold text-foreground">Creator</span>
            <span className="text-xs text-muted-foreground text-center">I review and approve videos</span>
          </button>
          <button
            onClick={() => onSelect("editor")}
            className="border rounded-xl p-5 flex flex-col items-center gap-2 hover:border-primary hover:bg-primary/5 transition-all"
          >
            <span className="text-2xl">✂️</span>
            <span className="font-semibold text-foreground">Editor</span>
            <span className="text-xs text-muted-foreground text-center">I upload and submit videos</span>
          </button>
        </div>
        <button onClick={onClose} className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
      </motion.div>
    </div>
  );
}

export default function AuthPage({ mode = "login" }: { mode?: "login" | "register" }) {
  const { login, register, isLoggingIn, isRegistering } = useAuth();
  const [showRolePicker, setShowRolePicker] = useState(false);
  const params = new URLSearchParams(window.location.search);
  const defaultRole = (params.get("role") === "creator" ? "creator" : "editor") as "creator" | "editor";
  const isLogin = mode === "login";

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", name: "", role: defaultRole },
  });

  const handleGoogleSignup = (role: "creator" | "editor") => {
    setShowRolePicker(false);
    window.location.href = apiUrl(`/api/auth/google?role=${role}`);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {showRolePicker && (
        <GoogleRolePicker
          onSelect={handleGoogleSignup}
          onClose={() => setShowRolePicker(false)}
        />
      )}

      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col px-8 sm:px-16 lg:px-24 xl:px-32 pt-8 pb-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group mb-12">
          <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="MediaLayer" className="w-8 h-8 rounded-lg object-contain bg-white p-0.5" />
          <span className="font-display font-bold text-lg group-hover:text-primary transition-colors">MediaLayer</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full mx-auto"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold tracking-tight mb-2">
              {isLogin ? "Welcome back" : "Create an account"}
            </h1>
            <p className="text-muted-foreground">
              {isLogin
                ? "Enter your details to access your workspace."
                : "Join MediaLayer to streamline your video collaboration."}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={loginForm.handleSubmit(d => login(d))}
                className="space-y-5"
              >
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <input {...loginForm.register("email")} className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground input-ring" placeholder="you@example.com" />
                  {loginForm.formState.errors.email && <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Password</label>
                  <input type="password" {...loginForm.register("password")} className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground input-ring" placeholder="••••••••" />
                  {loginForm.formState.errors.password && <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>}
                </div>
                <Button type="submit" disabled={isLoggingIn} className="w-full btn-primary-gradient py-3 rounded-xl text-base">
                  {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                  <div className="relative flex justify-center text-xs text-muted-foreground"><span className="bg-background px-3">or</span></div>
                </div>

                <a href={apiUrl("/api/auth/google?role=editor")} className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:bg-secondary transition-colors text-sm font-medium">
                  <GoogleIcon /> Continue with Google
                </a>

                <p className="text-center text-sm text-muted-foreground">
                  Don't have an account? <Link href="/register" className="text-primary font-semibold hover:underline">Sign up</Link>
                </p>
              </motion.form>
            ) : (
              <motion.form
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={registerForm.handleSubmit(d => register(d))}
                className="space-y-5"
              >
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Full Name</label>
                  <input {...registerForm.register("name")} className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground input-ring" placeholder="John Doe" />
                  {registerForm.formState.errors.name && <p className="text-sm text-destructive">{registerForm.formState.errors.name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <input {...registerForm.register("email")} className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground input-ring" placeholder="you@example.com" />
                  {registerForm.formState.errors.email && <p className="text-sm text-destructive">{registerForm.formState.errors.email.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Password</label>
                  <input type="password" {...registerForm.register("password")} className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground input-ring" placeholder="••••••••" />
                  {registerForm.formState.errors.password && <p className="text-sm text-destructive">{registerForm.formState.errors.password.message}</p>}
                </div>
                <div className="space-y-3 pt-1">
                  <label className="text-sm font-medium text-foreground">I am a...</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(["creator", "editor"] as const).map(r => (
                      <label key={r} className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${registerForm.watch("role") === r ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:bg-secondary"}`}>
                        <input type="radio" value={r} {...registerForm.register("role")} className="hidden" />
                        <span className="font-semibold text-foreground capitalize">{r}</span>
                        <span className="text-xs text-muted-foreground text-center">{r === "creator" ? "I review and approve videos" : "I upload and submit videos"}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Button type="submit" disabled={isRegistering} className="w-full btn-primary-gradient py-3 rounded-xl text-base">
                  {isRegistering ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                  <div className="relative flex justify-center text-xs text-muted-foreground"><span className="bg-background px-3">or</span></div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowRolePicker(true)}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:bg-secondary transition-colors text-sm font-medium"
                >
                  <GoogleIcon /> Sign up with Google
                </button>

                <p className="text-center text-sm text-muted-foreground">
                  Already have an account? <Link href="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Right side */}
      <div className="hidden lg:block lg:w-1/2 relative bg-primary/5 border-l border-border/50 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-background z-10" />
        <img src={`${import.meta.env.BASE_URL}images/hero-bg.png`} alt="" className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-50" />
        <div className="absolute inset-0 z-20 flex items-center justify-center p-16">
          <div className="glass-card max-w-md p-8 rounded-3xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-[#7c3aed] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/20">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            </div>
            <h2 className="text-2xl font-display font-bold mb-4">Focus on creation.</h2>
            <p className="text-muted-foreground">MediaLayer handles the messy back-and-forth of video approvals so you and your team can focus on making incredible content.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
