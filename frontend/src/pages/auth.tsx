import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, CheckCircle } from "lucide-react";
import { apiUrl } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

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

function GoogleRolePicker({ onSelect, onClose }: { onSelect: (role: "creator" | "editor") => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">
        <h2 className="text-xl font-bold mb-1 text-gray-900 text-center">I am a...</h2>
        <p className="text-sm text-gray-500 text-center mb-6">Choose your role to continue with Google</p>
        <div className="grid grid-cols-2 gap-3">
          {(["creator", "editor"] as const).map((r) => (
            <button
              key={r}
              onClick={() => onSelect(r)}
              className="border border-gray-200 rounded-2xl p-5 flex flex-col items-center gap-2 hover:border-[#4f46e5] hover:bg-[#eef2ff] transition-colors"
            >
              <span className="text-2xl">{r === "creator" ? "🎬" : "✂️"}</span>
              <span className="font-semibold text-gray-900 capitalize text-sm">{r}</span>
              <span className="text-xs text-gray-500 text-center leading-relaxed">
                {r === "creator" ? "I review and approve videos" : "I upload and submit videos"}
              </span>
            </button>
          ))}
        </div>
        <button onClick={onClose} className="w-full mt-5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

// Brief: 8–16px border-radius on inputs, not pill-shaped
const inputClass =
  "w-full px-4 py-3 rounded-2xl bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:border-gray-400 transition-colors";

const labelClass = "block text-sm text-gray-600 mb-1.5";

export default function AuthPage({ mode = "login" }: { mode?: "login" | "register" }) {
  const { login, register, isLoggingIn, isRegistering } = useAuth();
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const { toast } = useToast();
  const params = new URLSearchParams(window.location.search);
  const defaultRole = (params.get("role") === "creator" ? "creator" : "editor") as "creator" | "editor";
  const isLogin = mode === "login";
  const justVerified = params.get("verified") === "1";
  const verifiedEmail = params.get("email") || "";

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    setIsResending(true);
    try {
      const res = await fetch(apiUrl("/api/auth/resend-verification"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: unverifiedEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast({ title: "Email sent", description: data.message || "Check your inbox." });
      } else {
        toast({ title: "Error", description: data.error || `Server error (${res.status})`, variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", description: "Could not reach the server.", variant: "destructive" });
    } finally {
      setIsResending(false);
    }
  };

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: verifiedEmail, password: "" },
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
    // Brief: centered gradient, soft cool-toned, not directional from one corner
    <div className="min-h-screen flex flex-col" style={{ background: "radial-gradient(ellipse at 50% 40%, #f0eef8 0%, #e2ddf2 40%, #cdc6e8 100%)" }}>
      {showRolePicker && (
        <GoogleRolePicker onSelect={handleGoogleSignup} onClose={() => setShowRolePicker(false)} />
      )}

      {/* Top-left logo — consistent treatment */}
      <div className="px-8 pt-7">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <img
            src={`${import.meta.env.BASE_URL}images/logo.png`}
            alt="MediaLayer"
            className="w-8 h-8 rounded-xl object-contain"
          />
          <span className="font-bold text-gray-900 text-base">MediaLayer</span>
        </Link>
      </div>

      {/* Center content — brief: 48–64px between sections */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-[400px]">

          {/* Card — brief: 24–32px padding, 16px border-radius, soft shadow */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-md shadow-black/[0.07] px-8 py-8">
            <h1 className="text-[26px] font-bold text-gray-900 text-center leading-tight mb-6">
              {isLogin ? (
                <>Welcome back to<br />MediaLayer</>
              ) : (
                <>Start using<br />MediaLayer for free</>
              )}
            </h1>

            <AnimatePresence mode="wait">
              {isLogin ? (
                <motion.form
                  key="login"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  onSubmit={loginForm.handleSubmit(async (d) => {
                    try {
                      setUnverifiedEmail(null);
                      await login(d);
                    } catch (err: any) {
                      const msg: string = err?.data?.error || err?.message || "";
                      if (msg.toLowerCase().includes("verify your email")) {
                        setUnverifiedEmail(d.email);
                      }
                    }
                  })}
                >
                  {/* Google — brief: more visually active primary CTA */}
                  <a
                    href={apiUrl("/api/auth/google?role=editor")}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl border-2 border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 text-sm font-semibold text-gray-800 transition-colors"
                  >
                    <GoogleIcon /> Sign in with Google
                  </a>

                  {/* Divider — brief: 16px spacing between elements */}
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400 tracking-widest">OR</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  {justVerified && (
                    <div className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700 mb-4">
                      <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      Email verified. Enter your password to sign in.
                    </div>
                  )}

                  {/* Fields — brief: 16px spacing between elements */}
                  <div className="mb-4">
                    <label className={labelClass}>Work email</label>
                    <input {...loginForm.register("email")} className={inputClass} placeholder="name@company.com" />
                    {loginForm.formState.errors.email && (
                      <p className="text-xs text-red-500 mt-1">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className={labelClass}>Password</label>
                    <input type="password" {...loginForm.register("password")} className={inputClass} placeholder="••••••••" />
                    {loginForm.formState.errors.password && (
                      <p className="text-xs text-red-500 mt-1">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  {/* Continue — brief: subdued, secondary to Google */}
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continue"}
                  </button>

                  {unverifiedEmail && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 mt-4">
                      <p className="mb-1">Didn't receive the verification email?</p>
                      <button
                        type="button"
                        onClick={handleResendVerification}
                        disabled={isResending}
                        className="font-semibold underline hover:no-underline disabled:opacity-50 flex items-center gap-1"
                      >
                        {isResending && <Loader2 className="w-3 h-3 animate-spin" />}
                        Resend verification email
                      </button>
                    </div>
                  )}

                  {/* Legal — brief: accent purple used sparingly, only for links */}
                  <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed">
                    By signing in, you agree to MediaLayer's{" "}
                    <Link href="/terms" className="text-[#4f46e5] hover:underline">Terms</Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-[#4f46e5] hover:underline">Privacy Policy</Link>.
                  </p>
                </motion.form>
              ) : (
                <motion.form
                  key="register"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  onSubmit={registerForm.handleSubmit((d) => register(d))}
                >
                  {/* Google — primary CTA */}
                  <button
                    type="button"
                    onClick={() => setShowRolePicker(true)}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl border-2 border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 text-sm font-semibold text-gray-800 transition-colors"
                  >
                    <GoogleIcon /> Sign up with Google
                  </button>

                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400 tracking-widest">OR</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  <div className="mb-4">
                    <label className={labelClass}>Full name</label>
                    <input {...registerForm.register("name")} className={inputClass} placeholder="John Doe" />
                    {registerForm.formState.errors.name && (
                      <p className="text-xs text-red-500 mt-1">{registerForm.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className={labelClass}>Work email</label>
                    <input {...registerForm.register("email")} className={inputClass} placeholder="name@company.com" />
                    {registerForm.formState.errors.email && (
                      <p className="text-xs text-red-500 mt-1">{registerForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className={labelClass}>Password</label>
                    <input type="password" {...registerForm.register("password")} className={inputClass} placeholder="••••••••" />
                    {registerForm.formState.errors.password && (
                      <p className="text-xs text-red-500 mt-1">{registerForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className={labelClass}>I am a...</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["creator", "editor"] as const).map((r) => (
                        <label
                          key={r}
                          className={`cursor-pointer border rounded-2xl p-3 flex flex-col items-center gap-1 transition-colors ${
                            registerForm.watch("role") === r
                              ? "border-[#4f46e5] bg-[#eef2ff]"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <input type="radio" value={r} {...registerForm.register("role")} className="hidden" />
                          <span className="font-semibold text-gray-900 capitalize text-sm">{r}</span>
                          <span className="text-xs text-gray-500 text-center">
                            {r === "creator" ? "Review & approve" : "Upload & submit"}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isRegistering}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    {isRegistering ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continue"}
                  </button>

                  <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed">
                    By signing up, you agree to MediaLayer's{" "}
                    <Link href="/terms" className="text-[#4f46e5] hover:underline">Terms</Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-[#4f46e5] hover:underline">Privacy Policy</Link>.
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Sign in/up toggle — brief: secondary path, below card, 48px gap */}
          <p className="text-center text-sm text-gray-700 mt-5">
            {isLogin ? (
              <>Don't have an account?{" "}
                <Link href="/register" className="text-[#4f46e5] hover:underline">Sign up</Link>
              </>
            ) : (
              <>Already have an account?{" "}
                <Link href="/login" className="text-[#4f46e5] hover:underline">Sign in</Link>
              </>
            )}
          </p>

          {/* Testimonial — brief: 48–64px below card section */}
          <div className="mt-14 text-center max-w-sm mx-auto">
            <p className="text-sm text-gray-800 leading-relaxed">
              I've <span className="font-bold">sent videos externally three times this month instead of scheduling a meeting</span>{" "}
              and the first response is always, "This is great, why don't more people do this?"
            </p>
            <div className="flex items-center justify-center gap-3 mt-5">
              <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                N
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">Nayan R.</p>
                <p className="text-xs text-gray-500">Founder, MediaLayer</p>
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}
