import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useListVideos } from "@workspace/api-client-react";
import { VideoCard } from "@/components/ui/video-card";
import { Loader2, Video as VideoIcon, Clock, CheckCircle2, Upload, XCircle, Trash2, AlertTriangle, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function CreatorDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("layer_token");
    fetch("/api/users/invite-code", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setInviteCode(d.inviteCode))
      .catch(() => {});
  }, []);

  const copyCode = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!", description: "Share this code with your editors." });
  };

  const { data, isLoading } = useListVideos(undefined, {
    query: { enabled: !!user, queryKey: ["/api/videos"] },
  });
  const videos = data?.videos || [];

  const pending = videos.filter(v => v.status === "pending");
  const approved = videos.filter(v => v.status === "approved");
  const uploaded = videos.filter(v => v.status === "uploaded");
  const rejected = videos.filter(v => v.status === "rejected");

  const stats = [
    { label: "Needs Review", value: pending.length, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Approved", value: approved.length, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Uploaded", value: uploaded.length, icon: Upload, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Rejected", value: rejected.length, icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
  ];

  const handleDeleteRequest = (id: string) => {
    const video = videos.find(v => v.id === id);
    if (video) setDeleteTarget({ id, title: video.title });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem("layer_token");
      const res = await fetch(`/api/videos/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({ title: "Video deleted", description: `"${deleteTarget.title}" has been removed.` });
      setDeleteTarget(null);
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-8">

      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Welcome back, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-muted-foreground mt-1">Here's what's happening with your videos today.</p>
      </div>

      {/* Invite Code Banner */}
      {inviteCode && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Your Editor Invite Code</p>
            <p className="text-xs text-muted-foreground mt-0.5">Share this code with editors so they can link to your account</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xl font-bold tracking-widest text-primary bg-primary/10 px-4 py-2 rounded-xl border border-primary/20">
              {inviteCode}
            </span>
            <Button size="sm" variant="outline" onClick={copyCode} className="rounded-xl border-primary/30 text-primary hover:bg-primary/10">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* Stats */}
      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border/50 rounded-2xl p-5 flex items-center gap-4"
              >
                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pending review section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                Needs Review
                {pending.length > 0 && (
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-[11px] text-primary-foreground font-bold">
                    {pending.length}
                  </span>
                )}
              </h2>
              <Link href="/dashboard/creator/videos">
                <span className="text-sm text-primary hover:underline cursor-pointer">View all videos →</span>
              </Link>
            </div>

            {pending.length === 0 ? (
              <div className="bg-card border border-border/50 rounded-2xl p-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
                  <VideoIcon className="w-8 h-8 text-muted-foreground opacity-50" />
                </div>
                <h3 className="font-bold text-lg mb-1">Inbox zero!</h3>
                <p className="text-muted-foreground text-sm">No videos waiting for review right now.</p>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {pending.map((video) => (
                  <VideoCard key={video.id} video={video} rolePath="creator" onDelete={handleDeleteRequest} />
                ))}
              </motion.div>
            )}
          </div>

          {/* Recently approved */}
          {approved.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Ready to Upload
              </h2>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {approved.map((video) => (
                  <VideoCard key={video.id} video={video} rolePath="creator" onDelete={handleDeleteRequest} />
                ))}
              </motion.div>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !isDeleting && setDeleteTarget(null)}
            />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-card rounded-3xl shadow-2xl border border-border/50 w-full max-w-md p-8 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-5">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-xl font-bold mb-2">Delete this video?</h2>
              <p className="text-muted-foreground text-sm mb-1">You're about to permanently delete:</p>
              <p className="font-semibold text-foreground mb-6">"{deleteTarget.title}"</p>
              <p className="text-xs text-muted-foreground mb-8">This cannot be undone.</p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>Cancel</Button>
                <Button variant="destructive" className="flex-1 rounded-xl" onClick={confirmDelete} disabled={isDeleting}>
                  {isDeleting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Deleting…</> : <><Trash2 className="w-4 h-4 mr-2" />Delete</>}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
