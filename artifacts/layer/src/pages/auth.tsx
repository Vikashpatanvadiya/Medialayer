import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = loginSchema.extend({
  name: z.string().min(2, "Name is required"),
  role: z.enum(["creator", "editor"]),
});

export default function AuthPage({ mode = "login" }: { mode?: "login" | "register" }) {
  const { login, register, isLoggingIn, isRegistering } = useAuth();
  const [location] = useLocation();
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

  const onLoginSubmit = async (data: z.infer<typeof loginSchema>) => {
    await login({ data });
  };

  const onRegisterSubmit = async (data: z.infer<typeof registerSchema>) => {
    await register({ data });
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 xl:px-32 relative z-10">
        <Link href="/" className="absolute top-8 left-8 sm:left-16 lg:left-24 flex items-center gap-2 group">
           <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Layer" className="w-6 h-6 rounded" />
           <span className="font-display font-bold text-lg group-hover:text-primary transition-colors">Layer</span>
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
                : "Join Layer to streamline your video collaboration."}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                className="space-y-5"
              >
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <input 
                    {...loginForm.register("email")}
                    className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground input-ring"
                    placeholder="you@example.com"
                  />
                  {loginForm.formState.errors.email && <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Password</label>
                  <input 
                    type="password"
                    {...loginForm.register("password")}
                    className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground input-ring"
                    placeholder="••••••••"
                  />
                  {loginForm.formState.errors.password && <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>}
                </div>
                <Button type="submit" disabled={isLoggingIn} className="w-full btn-primary-gradient py-6 rounded-xl text-base mt-2">
                  {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
                </Button>
                <p className="text-center text-sm text-muted-foreground mt-6">
                  Don't have an account? <Link href="/register" className="text-primary font-semibold hover:underline">Sign up</Link>
                </p>
              </motion.form>
            ) : (
              <motion.form
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                className="space-y-5"
              >
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Full Name</label>
                  <input 
                    {...registerForm.register("name")}
                    className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground input-ring"
                    placeholder="John Doe"
                  />
                  {registerForm.formState.errors.name && <p className="text-sm text-destructive">{registerForm.formState.errors.name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <input 
                    {...registerForm.register("email")}
                    className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground input-ring"
                    placeholder="you@example.com"
                  />
                  {registerForm.formState.errors.email && <p className="text-sm text-destructive">{registerForm.formState.errors.email.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Password</label>
                  <input 
                    type="password"
                    {...registerForm.register("password")}
                    className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground input-ring"
                    placeholder="••••••••"
                  />
                  {registerForm.formState.errors.password && <p className="text-sm text-destructive">{registerForm.formState.errors.password.message}</p>}
                </div>
                <div className="space-y-3 pt-2">
                  <label className="text-sm font-medium text-foreground">I am a...</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${registerForm.watch("role") === "creator" ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:bg-secondary"}`}>
                      <input type="radio" value="creator" {...registerForm.register("role")} className="hidden" />
                      <span className="font-semibold text-foreground">Creator</span>
                      <span className="text-xs text-muted-foreground text-center">I review and approve videos</span>
                    </label>
                    <label className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${registerForm.watch("role") === "editor" ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:bg-secondary"}`}>
                      <input type="radio" value="editor" {...registerForm.register("role")} className="hidden" />
                      <span className="font-semibold text-foreground">Editor</span>
                      <span className="text-xs text-muted-foreground text-center">I upload and submit videos</span>
                    </label>
                  </div>
                </div>

                <Button type="submit" disabled={isRegistering} className="w-full btn-primary-gradient py-6 rounded-xl text-base mt-4">
                  {isRegistering ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
                </Button>
                <p className="text-center text-sm text-muted-foreground mt-6">
                  Already have an account? <Link href="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative bg-primary/5 border-l border-border/50 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-background z-10" />
        <img 
          src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
          alt="Abstract pattern" 
          className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-50"
        />
        <div className="absolute inset-0 z-20 flex items-center justify-center p-16">
          <div className="glass-card max-w-md p-8 rounded-3xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-[#7c3aed] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/20">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round" className="text-white"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            </div>
            <h2 className="text-2xl font-display font-bold mb-4">Focus on creation.</h2>
            <p className="text-muted-foreground">Layer handles the messy back-and-forth of video approvals so you and your team can focus on making incredible content.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
