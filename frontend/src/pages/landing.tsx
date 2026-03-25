import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Play, CheckCircle2, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden font-sans selection:bg-primary/30">
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="MediaLayer" className="w-10 h-10 rounded-lg shadow-sm object-contain bg-white p-0.5" />
            <span className="text-xl font-display font-bold tracking-tight">MediaLayer</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Sign In
            </Link>
            <Link href="/register" className="px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-all hover:scale-105 active:scale-95 shadow-lg">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6">
        <div className="absolute inset-0 z-0">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
            alt="Abstract Background" 
            className="w-full h-full object-cover opacity-15 dark:opacity-20 mix-blend-screen"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 border border-primary/20">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              The new standard for video collaboration
            </span>
            <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight leading-[1.1] mb-8 text-foreground">
              Review videos <br className="hidden md:block" />
              <span className="gradient-text">without the friction.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Layer connects YouTube creators and editors seamlessly. Upload, review, approve, and publish — all in one beautifully crafted workspace.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register?role=creator" className="w-full sm:w-auto btn-primary-gradient px-8 py-4 rounded-xl text-base font-semibold flex items-center justify-center gap-2 group">
                Sign up as Creator
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/register?role=editor" className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border transition-all flex items-center justify-center gap-2">
                Sign up as Editor
              </Link>
            </div>
          </motion.div>

          {/* App Preview Mockup */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-20 relative mx-auto max-w-4xl rounded-2xl md:rounded-[2rem] border border-border/50 bg-background/50 backdrop-blur-xl shadow-2xl p-2"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-[#7c3aed]/30 rounded-[2.2rem] blur-2xl -z-10 opacity-50" />
            <div className="rounded-xl md:rounded-3xl overflow-hidden border border-border bg-card shadow-inner">
              {/* Fake App Header */}
              <div className="h-12 border-b border-border bg-secondary/50 flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
              </div>
              <div className="aspect-video bg-muted flex items-center justify-center relative overflow-hidden">
                {/* Unsplash abstract tech image placeholder for video */}
                {/* youtube video abstract vibrant placeholder */}
                <img src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=1200&q=80" alt="App Preview" className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-background/80 backdrop-blur-md flex items-center justify-center shadow-2xl">
                    <Play className="w-6 h-6 text-primary ml-1" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-secondary/30 border-y border-border/50">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-display font-bold">Lightning Fast Workflow</h3>
            <p className="text-muted-foreground leading-relaxed">No more Google Drive links lost in DMs. Editors submit, creators review, directly in the platform.</p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-6">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-display font-bold">Clear Approvals</h3>
            <p className="text-muted-foreground leading-relaxed">One click to approve, or reject with specific timestamped feedback. Everyone stays on the same page.</p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-6">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-display font-bold">Role-Based Access</h3>
            <p className="text-muted-foreground leading-relaxed">Dedicated dashboards for creators and editors designed specifically for what they need to see.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>© 2026 MediaLayer. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <a href="mailto:medialayer.app@gmail.com" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
