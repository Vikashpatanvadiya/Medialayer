import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useGetVideo, useApproveVideo, useRejectVideo } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Check, X, Loader2, ExternalLink, Calendar,
  User as UserIcon, Tag, Youtube, CheckCircle2, AlertCircle,
  RotateCcw, Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { apiUrl } from "@/lib/api";

// ── helpers ──────────────────────────────────────────────────────────────────

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending:  "bg-amber-50 text-amber-600 border-amber-200",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected: "bg-red-50 text-red-600 border-red-200",
    uploaded: "bg-blue-50 text-blue-600 border-blue-200",
  };
  return map[status] ?? "bg-gray-100 text-gray-600 border-gray-200";
}

function useYouTubeStatus(enabled: boolean) {
  const [status, setStatus] = useState<{ connected: boolean; channelName: string | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const fetch_ = async () => {
    const token = localStorage.getItem("layer_token");
    if (!token || !enabled) return;
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/youtube/status"), { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setStatus(await res.json());
    } finally { setLoading(false); }
  };
  useEffect(() => { fetch_(); }, [enabled]);
  return { status, loading, refetch: fetch_ };
}

// ── component ─────────────────────────────────────────────────────────────────

export default function VideoDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [rejectFeedback, setRejectFeedback] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoSrcLoading, setVideoSrcLoading] = useState(false);

  const isCreator = user?.role === "creator";
  const { status: ytStatus, loading: ytLoading, refetch: refetchYt } = useYouTubeStatus(isCreator);
  const { data: video, isLoading, error } = useGetVideo(id, { query: { enabled: !!id && !!user } });

  useEffect(() => {
    if (!id || !user) return;
    const token = localStorage.getItem("layer_token");
    if (!token) return;
    // Try fetching signed URL regardless — backend will 404 if no file exists
    setVideoSrcLoading(true);
    fetch(apiUrl(`/api/stream/${id}/url?token=${token}`), { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => setVideoSrc(d.url))
      .catch(() => setVideoSrc(null))
      .finally(() => setVideoSrcLoading(false));
  }, [id, user]);

  const approveMutation = useApproveVideo({
    mutation: {
      onMutate: () => queryClient.setQueryData([`/api/videos/${id}`], (old: any) => old ? { ...old, status: "approved" } : old),
      onSuccess: (data) => {
        queryClient.setQueryData([`/api/videos/${id}`], data);
        queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
        toast({ title: "Video Approved!", description: "The editor has been notified." });
      },
      onError: () => {
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
      onError: () => toast({ title: "Reject failed", description: "Please try again.", variant: "destructive" }),
    },
  });

  const connectYouTube = async () => {
    const token = localStorage.getItem("layer_token");
    const res = await fetch(apiUrl("/api/youtube/auth-url"), { headers: { Authorization: `Bearer ${token}` } });
    const { url } = await res.json();
    const popup = window.open(url, "youtube-auth", "width=500,height=650,scrollbars=yes");
    const pollInterval = setInterval(async () => {
      try {
        if (!popup || popup.closed) { clearInterval(pollInterval); await refetchYt(); setTimeout(() => refetchYt(), 500); }
      } catch {}
    }, 1500);
    const handler = async (e: MessageEvent) => {
      if (e.data?.type === "YOUTUBE_CONNECTED") {
        window.removeEventListener("message", handler); clearInterval(pollInterval); popup?.close();
        await refetchYt(); toast({ title: "YouTube connected!", description: `Channel: ${e.data.channelName}` });
      }
    };
    window.addEventListener("message", handler);
    setTimeout(() => { clearInterval(pollInterval); window.removeEventListener("message", handler); }, 10 * 60 * 1000);
  };

  const uploadToYouTube = async () => {
    if (!video) return;
    setIsUploading(true);
    try {
      const token = localStorage.getItem("layer_token");
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/youtube/upload/${video.id}`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      toast({ title: "Uploading to YouTube…", description: "This may take a minute." });
      const pollStart = Date.now();
      const poll = setInterval(async () => {
        try {
          const r = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/videos/${video.id}`, { headers: { Authorization: `Bearer ${token}` } });
          if (!r.ok) return;
          const updated = await r.json();
          if (updated.status === "uploaded" && updated.youtubeUrl && !updated.youtubeUrl.startsWith("error:")) {
            clearInterval(poll); setIsUploading(false);
            queryClient.setQueryData([`/api/videos/${id}`], updated);
            queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
            toast({ title: "Uploaded to YouTube!", description: "View it in YouTube Studio." });
          } else if (updated.youtubeUrl?.startsWith("error:")) {
            clearInterval(poll); setIsUploading(false);
            toast({ title: "YouTube upload failed", description: updated.youtubeUrl.replace("error:", ""), variant: "destructive" });
          } else if (Date.now() - pollStart > 10 * 60 * 1000) {
            clearInterval(poll); setIsUploading(false);
            toast({ title: "Upload timed out", description: "Check YouTube Studio.", variant: "destructive" });
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
      const res = await fetch(apiUrl(`/api/videos/${video.id}/rollback`), { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Rollback failed");
      toast({ title: "Rolled back to pending" });
      queryClient.invalidateQueries({ queryKey: [`/api/videos/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
    } catch (err: any) {
      toast({ title: "Rollback failed", description: err.message, variant: "destructive" });
    } finally { setIsRollingBack(false); }
  };

  const deleteVideo = async () => {
    if (!video || !window.confirm(`Delete "${video.title}"? This cannot be undone.`)) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem("layer_token");
      const res = await fetch(apiUrl(`/api/videos/${video.id}`), { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      toast({ title: "Video deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      setLocation(backPath);
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    } finally { setIsDeleting(false); }
  };

  // ── loading / error states ──────────────────────────────────────────────────

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
    </div>
  );

  if (error || !video) return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <h2 className="text-xl font-bold text-[#333] mb-2">Video Not Found</h2>
      <p className="text-[#6c757d] text-sm mb-6">The video doesn't exist or you don't have access.</p>
      <button
        onClick={() => setLocation(`/dashboard/${user?.role}`)}
        className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors"
      >
        Back to Dashboard
      </button>
    </div>
  );

  const embedUrl = (() => {
    const m = video.youtubeUrl?.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/);
    return m?.[1] ? `https://www.youtube.com/embed/${m[1]}` : null;
  })();

  const backPath = `/dashboard/${user?.role}`;

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-10">

      {/* Back link */}
      <Link href={backPath} className="inline-flex items-center gap-1.5 text-sm text-[#6c757d] hover:text-[#333] transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      {/* Page header — brief: ~28px bold #333, status badge, action buttons */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-[26px] font-bold text-[#333] leading-tight">{video.title}</h1>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${statusBadge(video.status)}`}>
            {video.status}
          </span>
        </div>

        {/* Action buttons — brief: purple primary, outlined secondary, 8px radius */}
        <div className="flex items-center gap-2 flex-wrap">
          {isCreator && video.status === "pending" && !showRejectForm && (
            <>
              <button
                onClick={() => setShowRejectForm(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors"
              >
                <X className="w-4 h-4" /> Reject
              </button>
              <button
                onClick={() => approveMutation.mutate({ id })}
                disabled={approveMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors shadow-sm disabled:opacity-60"
              >
                {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Approve
              </button>
            </>
          )}
          {isCreator && video.status === "approved" && (
            <button
              onClick={rollback}
              disabled={isRollingBack}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-amber-200 text-amber-600 text-sm font-semibold hover:bg-amber-50 transition-colors disabled:opacity-60"
            >
              {isRollingBack ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              Rollback
            </button>
          )}
          {!isCreator && video.status === "rejected" && (
            <button
              onClick={rollback}
              disabled={isRollingBack}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-amber-200 text-amber-600 text-sm font-semibold hover:bg-amber-50 transition-colors disabled:opacity-60"
            >
              {isRollingBack ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              Resubmit
            </button>
          )}
          <button
            onClick={deleteVideo}
            disabled={isDeleting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-60"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete
          </button>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left — video + description */}
        <div className="lg:col-span-2 space-y-5">

          {/* Video player — brief: white card, 8px radius, shadow */}
          <div className="bg-black rounded-lg overflow-hidden shadow-[0px_4px_8px_rgba(0,0,0,0.1)] aspect-video">
            {embedUrl ? (
              <iframe src={embedUrl} className="w-full h-full" allowFullScreen title="Video Player" />
            ) : videoSrcLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-white animate-spin" />
              </div>
            ) : videoSrc ? (
              <video key={videoSrc} src={videoSrc} controls className="w-full h-full" preload="metadata" controlsList="nodownload" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/40 text-sm">
                No video available
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-[0px_4px_8px_rgba(0,0,0,0.06)]">
            <h3 className="text-[16px] font-bold text-[#333] mb-3">Description</h3>
            <p className="text-sm text-[#6c757d] leading-relaxed whitespace-pre-wrap">
              {video.description || "No description provided."}
            </p>
          </div>

          {/* Reject form */}
          {showRejectForm && (
            <div className="bg-white border border-red-200 rounded-lg p-6 shadow-[0px_4px_8px_rgba(0,0,0,0.06)]">
              <h3 className="text-sm font-bold text-red-600 mb-3 flex items-center gap-2">
                <X className="w-4 h-4" /> Request Changes
              </h3>
              <textarea
                value={rejectFeedback}
                onChange={(e) => setRejectFeedback(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-[#333] resize-none focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-colors"
                rows={4}
                placeholder="Tell the editor what needs to be fixed..."
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setShowRejectForm(false)}
                  className="px-4 py-2 rounded-lg text-sm text-[#6c757d] hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={!rejectFeedback.trim() || rejectMutation.isPending}
                  onClick={() => rejectMutation.mutate({ id, data: { feedback: rejectFeedback } })}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {rejectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Feedback"}
                </button>
              </div>
            </div>
          )}

          {/* Rejection feedback */}
          {video.status === "rejected" && video.rejectionFeedback && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-5 shadow-[0px_4px_8px_rgba(0,0,0,0.04)]">
              <h3 className="text-sm font-bold text-red-600 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Rejection Feedback
              </h3>
              <p className="text-sm text-red-700 leading-relaxed italic border-l-2 border-red-300 pl-3">
                "{video.rejectionFeedback}"
              </p>
            </div>
          )}
        </div>

        {/* Right — details + YouTube */}
        <div className="space-y-5">

          {/* Details card */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-[0px_4px_8px_rgba(0,0,0,0.06)] space-y-4">
            <h3 className="text-[15px] font-bold text-[#333] pb-3 border-b border-gray-100">Details</h3>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <UserIcon className="w-4 h-4 text-[#6c757d]" />
              </div>
              <div>
                <p className="text-xs text-[#6c757d]">Editor</p>
                <p className="text-sm font-semibold text-[#333]">{video.editor?.name || "Unknown"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-[#6c757d]" />
              </div>
              <div>
                <p className="text-xs text-[#6c757d]">Submitted</p>
                <p className="text-sm font-semibold text-[#333]">
                  {format(new Date(video.createdAt), "MMM d, yyyy")}
                </p>
                <p className="text-xs text-[#6c757d]">
                  {format(new Date(video.createdAt), "h:mm a")}
                </p>
              </div>
            </div>

            {video.fileSize && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <ExternalLink className="w-4 h-4 text-[#6c757d]" />
                </div>
                <div>
                  <p className="text-xs text-[#6c757d]">File Size</p>
                  <p className="text-sm font-semibold text-[#333]">{(video.fileSize / (1024 * 1024)).toFixed(1)} MB</p>
                </div>
              </div>
            )}

            {video.tags && video.tags.length > 0 && (
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-[#6c757d] mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> Tags
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {video.tags.map((t) => (
                    <span key={t} className="px-2.5 py-1 bg-gray-100 text-[#6c757d] rounded-lg text-xs font-medium">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* YouTube card — creators only */}
          {isCreator && (video.status === "approved" || video.status === "uploaded") && (
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-[0px_4px_8px_rgba(0,0,0,0.06)] space-y-4">
              <h3 className="text-[15px] font-bold text-[#333] flex items-center gap-2 pb-3 border-b border-gray-100">
                <Youtube className="w-4 h-4 text-red-500" /> YouTube Upload
              </h3>

              {video.status === "uploaded" && video.youtubeUrl && !video.youtubeUrl.startsWith("error:") ? (
                <>
                  <div className="flex items-center gap-2 text-emerald-600 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-semibold">Uploaded successfully</span>
                  </div>
                  <a
                    href={video.youtubeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" /> View on YouTube
                  </a>
                </>
              ) : video.status === "uploaded" ? (
                <>
                  <div className="flex items-center gap-2 text-emerald-600 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-semibold">Uploaded to YouTube</span>
                  </div>
                  <a
                    href="https://studio.youtube.com"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" /> Open YouTube Studio
                  </a>
                </>
              ) : ytLoading ? (
                <div className="flex items-center gap-2 text-[#6c757d] text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Checking connection…
                </div>
              ) : ytStatus?.connected ? (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-[#6c757d]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>{ytStatus.channelName}</span>
                    </div>
                    <button
                      onClick={async () => {
                        const token = localStorage.getItem("layer_token");
                        await fetch(apiUrl("/api/youtube/disconnect"), { method: "POST", headers: { Authorization: `Bearer ${token}` } });
                        await refetchYt();
                        toast({ title: "YouTube disconnected" });
                      }}
                      className="text-xs text-[#6c757d] hover:text-red-600 transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                  {/* Brief: solid purple primary CTA */}
                  <button
                    onClick={uploadToYouTube}
                    disabled={isUploading}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors shadow-sm disabled:opacity-60"
                  >
                    {isUploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><Youtube className="w-4 h-4" /> Upload to YouTube</>}
                  </button>
                  <p className="text-xs text-[#6c757d]">Video will be uploaded as public on YouTube.</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-[#6c757d]">Connect your YouTube channel to upload this video directly.</p>
                  <button
                    onClick={connectYouTube}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors"
                  >
                    <Youtube className="w-4 h-4" /> Connect YouTube Channel
                  </button>
                  <button
                    onClick={() => refetchYt()}
                    className="w-full text-xs text-[#6c757d] hover:text-[#333] transition-colors py-1"
                  >
                    Already connected? Refresh ↻
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
