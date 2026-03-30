import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-white">

      {/* Nav */}
      <nav className="px-8 py-5 flex items-center justify-between border-b border-gray-100">
        <Link href="/">
          <span style={{ fontFamily: "'Syne', sans-serif" }} className="font-extrabold text-[20px] tracking-tight text-[#1a1f3c]">
            MediaLayer
          </span>
        </Link>
        <div className="flex items-center gap-6 text-sm font-medium text-gray-600">
          <Link href="/#features" className="hover:text-gray-900 transition-colors">Features</Link>
          <Link href="/#pricing" className="hover:text-gray-900 transition-colors">Pricing</Link>
          <Link href="/register" className="px-4 py-2 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">

        {/* Glitch 404 visual */}
        <div className="relative mb-10 select-none" style={{ width: 520, maxWidth: "100%" }}>
          <div
            className="rounded-2xl overflow-hidden flex items-center justify-center"
            style={{
              height: 280,
              background: "linear-gradient(135deg, #1a1f3c 0%, #2d1b69 40%, #0f172a 100%)",
            }}
          >
            {/* Glitch layers */}
            <span
              className="absolute font-black text-white select-none pointer-events-none"
              style={{
                fontSize: "clamp(100px, 18vw, 180px)",
                letterSpacing: "-0.04em",
                opacity: 0.15,
                color: "#ff0040",
                transform: "translate(-4px, 2px)",
                mixBlendMode: "screen",
              }}
            >
              404
            </span>
            <span
              className="absolute font-black select-none pointer-events-none"
              style={{
                fontSize: "clamp(100px, 18vw, 180px)",
                letterSpacing: "-0.04em",
                opacity: 0.15,
                color: "#00ffcc",
                transform: "translate(4px, -2px)",
                mixBlendMode: "screen",
              }}
            >
              404
            </span>
            <span
              className="relative font-black text-white select-none"
              style={{
                fontSize: "clamp(100px, 18vw, 180px)",
                letterSpacing: "-0.04em",
                textShadow: "0 0 40px rgba(99,102,241,0.6), 0 0 80px rgba(99,102,241,0.3)",
              }}
            >
              404
            </span>
          </div>
        </div>

        {/* Copy */}
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
          You weren't supposed to see this.
        </h1>
        <p className="text-gray-500 text-base mb-8 max-w-sm">
          Sorry, but this page doesn't exist. Would be a great place for a video, though.
        </p>

        {/* CTAs */}
        <div className="flex flex-col items-center gap-3">
          <Link
            href="/"
            className="px-6 py-2.5 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
          >
            Go to Homepage
          </Link>
          <Link
            href="/login"
            className="text-sm text-gray-500 hover:text-gray-800 underline underline-offset-2 transition-colors"
          >
            Sign in to your account
          </Link>
        </div>
      </div>

    </div>
  );
}
