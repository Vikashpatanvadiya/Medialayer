import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useGetVideo, useApproveVideo, useRejectVideo } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Check, X, Loader2, ExternalLink, Calendar, User as UserIcon,
  Tag, Youtube, CheckCircle2, AlertCircle, RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BeautifulBadge } from "@/components/ui/beautiful-badge";
import { getStatusColor, getThumbnailUrl } from "@/components/ui/video-card";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { apiUrl } from "@/lib/api";

function Play(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function useYouTubeStatus(enabled: boolean) {
  const [status, setStatus] = useState<{ connected: boolean; channelName: string | null } | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch_ = async () => {
    const token = localStorage.getItem("layer_token");
    if (!token || !enabled) return;
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/youtube/status"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setStatus(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch_(); }, [enabled]);

  return { status, loading, refetch: fetch_ };
}

export default function VideoDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [rejectFeedback, setRejectFeedback] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoSrcLoading, setVideoSrcLoading] = useState(false);

  const isCreator = user?.role === "creator";
  const { status: ytStatus, loading: ytLoading, refetch: refetchYt } = useYouTubeStatus(isCreator);

  const { data: video, isLoading, error } = useGetVideo(id, {
    query: { enabled: !!id && !!user },
  });

  // Fetch a short-lived signed URL from the backend once we know the video has a file
  useEffect(() => {
    if (!video?.hasFile || !id) return;
    const token = localStorage.getItem("layer_token");
    if (!token) return;
    setVideoSrcLoading(true);
    fetch(apiUrl(`/api/stream/${id}/url?token=${token}`), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => setVideoSrc(data.url))
      .catch(() => setVideoSrc(null))
      .finally(() => setVideoSrcLoading(false));
  }, [video?.id, video?.hasFile]);

  const approveMutation = useApproveVideo({
    mutation: {
      onMutate: () => {
        // Optimistic update — immediately show approved status
        queryClient.setQueryData([`/api/videos/${id}`], (old: any) =>
          old ? { ...old, status: "approved" } : old
        );
      },
      onSuccess: (data) => {
        // Update cache with real server response
        queryClient.setQueryData([`/api/videos/${id}`], data);
        queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
        toast({ title: "Video Approved!", description: "The editor has been notified." });
      },
      onError: () => {
        // Revert on error
        queryClient.invalidateQueries({ queryKey: [`/api/videos/${id}`] });
        toast({ title: "Approve failed", description: "Please try again.", variant: "destructive" });
      },
    },
  });

  const rejectMutation = useRejectVideo({
    mutation: {
      onSuccess: (data) => {
        queryClient.setQueryData([`/api/videos/${id}`], data);
        queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
        toast({ title: "Feedback sent", description: "The editor has been notified." });
        setShowRejectForm(false);
        setRejectFeedback("");
      },
      onError: () => {
        toast({ title: "Reject failed", description: "Please try again.", variant: "destructive" });
      },
    },
  });

  const connectYouTube = async () => {
    const token = localStorage.getItem("layer_token");
    const res = await fetch(apiUrl("/api/youtube/auth-url"), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const { url } = await res.json();
    const popup = window.open(url, "youtube-auth", "width=500,height=650,scrollbars=yes");

    // Poll every 1.5s — when popup closes, refetch YouTube status
    const pollInterval = setInterval(async () => {
      try {
        if (!popup || popup.closed) {
          clearInterval(pollInterval);
          const prev = ytStatus?.connected;
          await refetchYt();
          // Small delay to let state update, then check
          setTimeout(async () => {
            await refetchYt();
          }, 500);
        }
      } catch {}
    }, 1500);

    // postMessage listener (works if same origin or CORS allows)
    const handler = async (e: MessageEvent) => {
      if (e.data?.type === "YOUTUBE_CONNECTED") {
        window.removeEventListener("message", handler);
        clearInterval(pollInterval);
        popup?.close();
        await refetchYt();
        toast({ title: "YouTube connected!", description: `Channel: ${e.data.channelName}` });
      }
    };
    window.addEventListener("message", handler);

    // Clean up after 10 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      window.removeEventListener("message", handler);
    }, 10 * 60 * 1000);
  };

  const uploadToYouTube = async () => {
    if (!video) return;
    setIsUploading(true);
    try {
      const token = localStorage.getItem("layer_token");
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/youtube/upload/${video.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      // Upload started in background — show uploading state and poll
      toast({ title: "Uploading to YouTube…", description: "This may take a minute. We'll update when done." });

      // Poll every 5s for up to 10 minutes
      const pollStart = Date.now();
      const poll = setInterval(async () => {
        try {
          const r = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/videos/${video.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!r.ok) return;
          const updated = await r.json();

          if (updated.status === "uploaded" && updated.youtubeUrl && !updated.youtubeUrl.startsWith("error:")) {
            clearInterval(poll);
            setIsUploading(false);
            queryClient.setQueryData([`/api/videos/${id}`], updated);
            queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
            toast({
              title: "Uploaded to YouTube!",
              description: (
                <a href={updated.youtubeUrl} target="_blank" rel="noreferrer" className="underline">
                  View on YouTube →
                </a>
              ) as any,
            });
          } else if (updated.youtubeUrl?.startsWith("error:")) {
            clearInterval(poll);
            setIsUploading(false);
            toast({ title: "YouTube upload failed", description: updated.youtubeUrl.replace("error:", ""), variant: "destructive" });
          } else if (Date.now() - pollStart > 10 * 60 * 1000) {
            clearInterval(poll);
            setIsUploading(false);
            toast({ title: "Upload timed out", description: "Check YouTube Studio to see if it appeared.", variant: "destructive" });
          }
        } catch {}
      }, 5000);
    } catch (err: any) {
      setIsUploading(false);
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    }
  };

  const rollback = async () => {
    if (!video) return;
    setIsRollingBack(true);
    try {
      const token = localStorage.getItem("layer_token");
      const res = await fetch(apiUrl(`/api/videos/${video.id}/rollback`), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Rollback failed");
      toast({ title: "Rolled back to pending", description: "The video is back in review queue." });
      queryClient.invalidateQueries({ queryKey: [`/api/videos/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
    } catch (err: any) {
      toast({ title: "Rollback failed", description: err.message, variant: "destructive" });
    } finally {
      setIsRollingBack(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full text-center">
        <h2 className="text-2xl font-bold">Video Not Found</h2>
        <p className="text-muted-foreground mt-2 mb-6">
          The video doesn't exist or you don't have access.
        </p>
        <Button onClick={() => setLocation(`/dashboard/${user?.role}`)}>Back to Dashboard</Button>
      </div>
    );
  }

  const embedUrl = (() => {
    const ytMatch = video.youtubeUrl?.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/);
    if (ytMatch?.[1]) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    return null;
  })();

  // videoSrc is fetched via useEffect above — a short-lived signed Cloudinary URL
  const backPath = `/dashboard/${user?.role}`;

  return (
    <div className="h-full flex flex-col pb-10">
      <div className="mb-6">
        <Link href={backPath} className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">{video.title}</h1>
            <BeautifulBadge variant={getStatusColor(video.status)} className="capitalize text-sm px-3 py-1">
              {video.status}
            </BeautifulBadge>
          </div>

          {isCreator && video.status === "pending" && !showRejectForm && (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowRejectForm(true)}
                className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground px-6"
              >
                <X className="w-4 h-4 mr-2" /> Reject
              </Button>
              <Button
                onClick={() => approveMutation.mutate({ id })}
                disabled={approveMutation.isPending}
                className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 border-none px-6"
              >
                {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                Approve
              </Button>
            </div>
          )}

          {/* Creator: rollback approved → pending */}
          {isCreator && video.status === "approved" && (
            <Button
              variant="outline"
              onClick={rollback}
              disabled={isRollingBack}
              className="rounded-xl border-amber-300 text-amber-600 hover:bg-amber-50 px-6"
            >
              {isRollingBack ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RotateCcw className="w-4 h-4 mr-2" />}
              Rollback to Pending
            </Button>
          )}

          {/* Editor: rollback rejected → pending */}
          {!isCreator && video.status === "rejected" && (
            <Button
              variant="outline"
              onClick={rollback}
              disabled={isRollingBack}
              className="rounded-xl border-amber-300 text-amber-600 hover:bg-amber-50 px-6"
            >
              {isRollingBack ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RotateCcw className="w-4 h-4 mr-2" />}
              Resubmit for Review
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Video Player */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-black rounded-3xl overflow-hidden shadow-2xl aspect-video border border-border/50">
            {embedUrl ? (
              <iframe src={embedUrl} className="w-full h-full" allowFullScreen title="Video Player" />
            ) : videoSrcLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            ) : videoSrc ? (
              <video
                key={videoSrc}
                src={videoSrc}
                controls
                className="w-full h-full"
                preload="metadata"
                controlsList="nodownload"
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                No video available
              </div>
            )}
          </div>

          <div className="bg-card p-6 rounded-3xl border border-border/50">
            <h3 className="text-xl font-bold mb-4">Description</h3>
            <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">{video.description || "No description provided."}</p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">

          {/* Reject form */}
          <AnimatePresence>
            {showRejectForm && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -20 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-destructive/5 border border-destructive/20 rounded-3xl p-6 overflow-hidden"
              >
                <h3 className="font-semibold text-destructive mb-2 flex items-center gap-2">
                  <X className="w-5 h-5" /> Request Changes
                </h3>
                <textarea
                  value={rejectFeedback}
                  onChange={(e) => setRejectFeedback(e.target.value)}
                  className="w-full mt-3 px-4 py-3 rounded-xl bg-background border border-destructive/20 text-foreground resize-none"
                  rows={4}
                  placeholder="Tell the editor what needs to be fixed..."
                />
                <div className="flex justify-end gap-3 mt-4">
                  <Button variant="ghost" onClick={() => setShowRejectForm(false)} className="rounded-xl">Cancel</Button>
                  <Button
                    variant="destructive"
                    className="rounded-xl"
                    disabled={!rejectFeedback.trim() || rejectMutation.isPending}
                    onClick={() => rejectMutation.mutate({ id, data: { feedback: rejectFeedback } })}
                  >
                    {rejectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Feedback"}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Rejection feedback display */}
          {video.status === "rejected" && video.rejectionFeedback && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-3xl p-6">
              <h3 className="font-semibold text-destructive mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> Rejection Feedback
              </h3>
              <p className="text-sm text-destructive-foreground/80 leading-relaxed italic border-l-2 border-destructive/40 pl-3">
                "{video.rejectionFeedback}"
              </p>
            </div>
          )}

          {/* YouTube Upload Section (creators only) */}
          {isCreator && (video.status === "approved" || video.status === "uploaded") && (
            <div className="bg-card border border-border/50 rounded-3xl p-6 space-y-4">
              <h3 className="font-bold flex items-center gap-2">
                <Youtube className="w-5 h-5 text-red-500" /> YouTube Upload
              </h3>

              {video.status === "uploaded" && video.youtubeUrl && !video.youtubeUrl.startsWith("error:") ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium text-sm">Uploaded successfully</span>
                  </div>
                  <a
                    href={video.youtubeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 w-full justify-center px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" /> View on YouTube
                  </a>
                </div>
              ) : video.status === "uploaded" && isUploading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Uploading to YouTube…
                </div>
              ) : video.status === "uploaded" ? (
                // status=uploaded but youtubeUrl missing or errored — video is on YT, just no link stored
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium text-sm">Uploaded to YouTube</span>
                  </div>
                  <a
                    href="https://studio.youtube.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 w-full justify-center px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" /> Open YouTube Studio
                  </a>
                </div>
              ) : ytLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Checking connection…
                </div>
              ) : ytStatus?.connected ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-muted-foreground">Connected as <span className="font-medium text-foreground">{ytStatus.channelName}</span></span>
                  </div>
                  <Button
                    onClick={uploadToYouTube}
                    disabled={isUploading}
                    className="w-full rounded-xl bg-red-500 hover:bg-red-600 text-white border-none"
                  >
                    {isUploading ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Uploading to YouTube…</>
                    ) : (
                      <><Youtube className="w-4 h-4 mr-2" /> Upload to YouTube</>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Video will be uploaded as private. You can change visibility in YouTube Studio.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Connect your YouTube channel to upload this video directly.
                  </p>
                  <Button
                    onClick={connectYouTube}
                    variant="outline"
                    className="w-full rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <Youtube className="w-4 h-4 mr-2" /> Connect YouTube Channel
                  </Button>
                  <button
                    onClick={() => refetchYt()}
                    className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                  >
                    Already connected? Click to refresh ↻
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Video details */}
          <div className="bg-card p-6 rounded-3xl border border-border/50 space-y-6">
            <h3 className="text-lg font-bold border-b border-border/50 pb-4">Details</h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                  <UserIcon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Editor</p>
                  <p className="text-sm text-muted-foreground">{video.editor?.name || "Unknown"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Submitted</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(video.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>

              {video.fileSize && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">File Size</p>
                    <p className="text-sm text-muted-foreground">
                      {(video.fileSize / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            {video.tags && video.tags.length > 0 && (
              <div className="pt-4 border-t border-border/50">
                <p className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4" /> Tags
                </p>
                <div className="flex flex-wrap gap-2">
                  {video.tags.map((t) => (
                    <span key={t} className="px-2.5 py-1 bg-secondary text-secondary-foreground rounded-md text-xs font-medium border border-border/50">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
