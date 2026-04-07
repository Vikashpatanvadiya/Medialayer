import { LoginForm } from "@/components/login-form";
import { SignupForm } from "@/components/signup-form";

export default function AuthPage({ mode = "login" }: { mode?: "login" | "register" }) {
  const isLogin = mode === "login";

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        {isLogin ? <LoginForm /> : <SignupForm />}
      </div>
    </div>
  );
}
