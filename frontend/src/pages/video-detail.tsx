import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useGetVideo, useApproveVideo, useRejectVideo } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Check, X, Loader2, ExternalLink, Calendar,
  User as UserIcon, Tag, Youtube, CheckCircle2, AlertCircle,
  RotateCcw, Trash2, Wallet, Send,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { apiUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";

// ── helpers ──────────────────────────────────────────────────────────────────

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending:  "bg-[var(--amber-1)] text-[var(--amber-4)] border-[var(--amber-2)]",
    approved: "bg-[var(--green-1)] text-[var(--green-4)] border-[var(--green-2)]",
    rejected: "bg-[var(--red-1)] text-[var(--red-4)] border-[var(--red-2)]",
    uploaded: "bg-[var(--sky-1)] text-[var(--sky-4)] border-[var(--sky-2)]",
  };
  return map[status] ?? "bg-muted text-muted-foreground border-border";
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
  const [privacyStatus, setPrivacyStatus] = useState<"public" | "unlisted" | "private">("public");
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoSrcLoading, setVideoSrcLoading] = useState(false);

  const isCreator = user?.role === "creator";
  const { status: ytStatus, loading: ytLoading, refetch: refetchYt } = useYouTubeStatus(isCreator);
  const { data: video, isLoading, error } = useGetVideo(id, { query: { enabled: !!id && !!user } });

  // Solana wallet for creator-to-editor payments
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected: walletConnected } = useWallet();
  const [payEditorAmount, setPayEditorAmount] = useState("0.1");
  const [isPayingEditor, setIsPayingEditor] = useState(false);

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
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ privacyStatus }),
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

  const payEditor = async () => {
    if (!video || !publicKey) return;
    const lamports = Math.round(parseFloat(payEditorAmount) * LAMPORTS_PER_SOL);
    if (!lamports || lamports <= 0) {
      toast({ title: "Invalid amount", description: "Enter a valid SOL amount.", variant: "destructive" });
      return;
    }

    // Get editor's wallet address from backend
    const token = localStorage.getItem("layer_token");
    const videoRes = await fetch(apiUrl(`/api/videos/${video.id}`), { headers: { Authorization: `Bearer ${token}` } });
    const videoData = await videoRes.json();
    // We need the editor's solanaWalletAddress — fetch it via a separate call
    const editorRes = await fetch(apiUrl("/api/users/my-editors"), { headers: { Authorization: `Bearer ${token}` } });
    const editorData = await editorRes.json();
    const editorInfo = editorData.editors?.find((e: any) => e.id === video.editorId);

    // Fallback: try to get wallet from video detail endpoint (not exposed yet)
    // We'll call the pay-editor route which will validate on-chain
    setIsPayingEditor(true);
    try {
      // Build and send the Solana transaction
      // We need the editor's wallet — fetch it from a dedicated endpoint
      const walletRes = await fetch(apiUrl(`/api/users/editor-wallet/${video.editorId}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!walletRes.ok) {
        const d = await walletRes.json().catch(() => ({}));
        throw new Error(d.error || "Editor has not set up a Solana wallet. Ask them to add it in their profile settings.");
      }
      const { walletAddress: editorWallet } = await walletRes.json();

      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(editorWallet),
          lamports,
        })
      );
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, "confirmed");

      // Record on backend
      const recordRes = await fetch(apiUrl(`/api/payments/pay-editor/${video.id}`), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ txSignature: sig, bountyLamports: lamports }),
      });
      const recordData = await recordRes.json();
      if (!recordRes.ok) throw new Error(recordData.error || "Failed to record payment");

      queryClient.invalidateQueries({ queryKey: [`/api/videos/${id}`] });
      toast({
        title: `Sent ${payEditorAmount} SOL to editor!`,
        description: `Tx: ${sig.slice(0, 8)}…`,
      });
    } catch (err: any) {
      toast({ title: "Payment failed", description: err.message, variant: "destructive" });
    } finally { setIsPayingEditor(false); }
  };

  // ── loading / error states ──────────────────────────────────────────────────

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );

  if (error || !video) return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <h2 className="text-xl font-bold text-foreground mb-2">Video Not Found</h2>
      <p className="text-muted-foreground text-sm mb-6">The video doesn't exist or you don't have access.</p>
      <button
        onClick={() => setLocation(`/dashboard/${user?.role}`)}
        className="px-4 py-2 rounded-[var(--radius-4)] bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
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
      <Link href={backPath} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      {/* Page header — brief: ~28px bold #333, status badge, action buttons */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-[26px] font-bold text-foreground leading-tight">{video.title}</h1>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${statusBadge(video.status)}`}>
            {video.status}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {isCreator && video.status === "pending" && !showRejectForm && (
            <>
              <Button variant="outline" size="sm" onClick={() => setShowRejectForm(true)}
                className="border-[var(--red-2)] text-[var(--red-4)] hover:bg-[var(--red-1)] hover:text-[var(--red-4)]">
                <X className="w-4 h-4" /> Reject
              </Button>
              <Button size="sm" onClick={() => approveMutation.mutate({ id })} disabled={approveMutation.isPending}
                className="bg-[var(--green-4)] hover:bg-[var(--green-3)] text-white border-none">
                {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Approve
              </Button>
            </>
          )}
          {isCreator && video.status === "approved" && (
            <Button variant="outline" size="sm" onClick={rollback} disabled={isRollingBack}
              className="border-[var(--amber-2)] text-[var(--amber-4)] hover:bg-[var(--amber-1)] hover:text-[var(--amber-4)]">
              {isRollingBack ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              Rollback
            </Button>
          )}
          {!isCreator && video.status === "rejected" && (
            <Button variant="outline" size="sm" onClick={rollback} disabled={isRollingBack}
              className="border-[var(--amber-2)] text-[var(--amber-4)] hover:bg-[var(--amber-1)] hover:text-[var(--amber-4)]">
              {isRollingBack ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              Resubmit
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={deleteVideo} disabled={isDeleting}
            className="border-[var(--red-2)] text-[var(--red-4)] hover:bg-[var(--red-1)] hover:text-[var(--red-4)]">
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete
          </Button>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left — video + description */}
        <div className="lg:col-span-2 space-y-5">

          {/* Video player — brief: white card, 8px radius, shadow */}
          <div className="bg-black rounded-[var(--radius-4)] overflow-hidden shadow-[var(--shadow-3)] aspect-video">
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
          <div className="bg-card border border-border rounded-[var(--radius-4)] p-6 shadow-[var(--shadow-2)]">
            <h3 className="text-[16px] font-bold text-foreground mb-3">Description</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {video.description || "No description provided."}
            </p>
          </div>

          {/* Reject form */}
          {showRejectForm && (
            <div className="bg-card border border-[var(--red-2)] rounded-[var(--radius-4)] p-6 shadow-[var(--shadow-2)]">
              <h3 className="text-sm font-bold text-[var(--red-4)] mb-3 flex items-center gap-2">
                <X className="w-4 h-4" /> Request Changes
              </h3>
              <textarea
                value={rejectFeedback}
                onChange={(e) => setRejectFeedback(e.target.value)}
                className="w-full px-3 py-2.5 rounded-[var(--radius-4)] border border-border text-sm text-foreground resize-none focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/50 transition-colors"
                rows={4}
                placeholder="Tell the editor what needs to be fixed..."
              />
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" size="sm" onClick={() => setShowRejectForm(false)}>Cancel</Button>
                <Button size="sm" disabled={!rejectFeedback.trim() || rejectMutation.isPending}
                  onClick={() => rejectMutation.mutate({ id, data: { feedback: rejectFeedback } })}
                  className="bg-[var(--red-4)] hover:bg-[var(--red-3)] text-white border-none">
                  {rejectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Feedback"}
                </Button>
              </div>
            </div>
          )}

          {/* Rejection feedback */}
          {video.status === "rejected" && video.rejectionFeedback && (
            <div className="bg-[var(--red-1)] border border-[var(--red-2)] rounded-[var(--radius-4)] p-5 shadow-[var(--shadow-1)]">
              <h3 className="text-sm font-bold text-[var(--red-4)] mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Rejection Feedback
              </h3>
              <p className="text-sm text-[var(--red-4)] leading-relaxed italic border-l-2 border-red-300 pl-3">
                "{video.rejectionFeedback}"
              </p>
            </div>
          )}
        </div>

        {/* Right — details + YouTube */}
        <div className="space-y-5">

          {/* Details card */}
          <div className="bg-card border border-border rounded-[var(--radius-4)] p-5 shadow-[var(--shadow-2)] space-y-4">
            <h3 className="text-[15px] font-bold text-foreground pb-3 border-b border-border">Details</h3>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[var(--radius-4)] bg-muted flex items-center justify-center shrink-0">
                <UserIcon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Editor</p>
                <p className="text-sm font-semibold text-foreground">{video.editor?.name || "Unknown"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[var(--radius-4)] bg-muted flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Submitted</p>
                <p className="text-sm font-semibold text-foreground">
                  {format(new Date(video.createdAt), "MMM d, yyyy")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(video.createdAt), "h:mm a")}
                </p>
              </div>
            </div>

            {video.fileSize && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[var(--radius-4)] bg-muted flex items-center justify-center shrink-0">
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">File Size</p>
                  <p className="text-sm font-semibold text-foreground">{(video.fileSize / (1024 * 1024)).toFixed(1)} MB</p>
                </div>
              </div>
            )}

            {video.tags && video.tags.length > 0 && (
              <div className="pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> Tags
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {video.tags.map((t) => (
                    <span key={t} className="px-2.5 py-1 bg-muted text-muted-foreground rounded-[var(--radius-4)] text-xs font-medium">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* YouTube card — creators only */}
          {isCreator && (video.status === "approved" || video.status === "uploaded") && (
            <div className="bg-card border border-border rounded-[var(--radius-4)] p-5 shadow-[var(--shadow-2)] space-y-4">
              <h3 className="text-[15px] font-bold text-foreground flex items-center gap-2 pb-3 border-b border-border">
                <Youtube className="w-4 h-4 text-[var(--red-4)]" /> YouTube Upload
              </h3>

              {video.status === "uploaded" && video.youtubeUrl && !video.youtubeUrl.startsWith("error:") ? (
                <>
                  <div className="flex items-center gap-2 text-[var(--green-4)] text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-semibold">Uploaded successfully</span>
                  </div>
                  <a
                    href={video.youtubeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-[var(--radius-4)] bg-[var(--red-4)] hover:bg-[var(--red-4)] text-white text-sm font-semibold transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" /> View on YouTube
                  </a>
                </>
              ) : video.status === "uploaded" ? (
                <>
                  <div className="flex items-center gap-2 text-[var(--green-4)] text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-semibold">Uploaded to YouTube</span>
                  </div>
                  <a
                    href="https://studio.youtube.com"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-[var(--radius-4)] bg-[var(--red-4)] hover:bg-[var(--red-4)] text-white text-sm font-semibold transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" /> Open YouTube Studio
                  </a>
                </>
              ) : ytLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Checking connection…
                </div>
              ) : ytStatus?.connected ? (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-[var(--green-4)]" />
                      <span>{ytStatus.channelName}</span>
                    </div>
                    <button
                      onClick={async () => {
                        const token = localStorage.getItem("layer_token");
                        await fetch(apiUrl("/api/youtube/disconnect"), { method: "POST", headers: { Authorization: `Bearer ${token}` } });
                        await refetchYt();
                        toast({ title: "YouTube disconnected" });
                      }}
                      className="text-xs text-muted-foreground hover:text-[var(--red-4)] transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                  {/* Privacy selector */}
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground font-medium">Visibility</p>
                    <div className="grid grid-cols-3 gap-2">
                      {(["public", "unlisted", "private"] as const).map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setPrivacyStatus(opt)}
                          className={`px-2 py-2 rounded-[var(--radius-4)] text-xs font-semibold border transition-colors capitalize ${
                            privacyStatus === opt
                              ? "bg-primary text-white border-primary"
                              : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-primary"
                          }`}
                        >
                          {opt === "public" ? "🌐 Public" : opt === "unlisted" ? "🔗 Unlisted" : "🔒 Private"}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {privacyStatus === "public" && "Visible to everyone on YouTube"}
                      {privacyStatus === "unlisted" && "Only people with the link can watch"}
                      {privacyStatus === "private" && "Only you can see this video"}
                    </p>
                  </div>
                  <button
                    onClick={uploadToYouTube}
                    disabled={isUploading}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-[var(--radius-4)] bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-colors shadow-[var(--shadow-1)] disabled:opacity-60"
                  >
                    {isUploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><Youtube className="w-4 h-4" /> Upload to YouTube</>}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">Connect your YouTube channel to upload this video directly.</p>
                  <button
                    onClick={connectYouTube}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-[var(--radius-4)] border border-[var(--red-2)] text-[var(--red-4)] text-sm font-semibold hover:bg-[var(--red-1)] transition-colors"
                  >
                    <Youtube className="w-4 h-4" /> Connect YouTube Channel
                  </button>
                  <button
                    onClick={() => refetchYt()}
                    className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                  >
                    Already connected? Refresh ↻
                  </button>
                </>
              )}
            </div>
          )}

          {/* Pay Editor card — creators only, on approved/uploaded videos */}
          {isCreator && (video.status === "approved" || video.status === "uploaded") && (
            <div className="bg-card border border-border rounded-[var(--radius-4)] p-5 shadow-[var(--shadow-2)] space-y-4">
              <h3 className="text-[15px] font-bold text-foreground flex items-center gap-2 pb-3 border-b border-border">
                <Wallet className="w-4 h-4 text-primary" /> Pay Editor
              </h3>

              {video.editorPaymentStatus === "paid" && video.editorPaymentTxSig ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[var(--green-4)] text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-semibold">
                      Paid {video.editorBountyLamports ? `${(video.editorBountyLamports / 1_000_000_000).toFixed(4)} SOL` : ""}
                    </span>
                  </div>
                  <a
                    href={`https://explorer.solana.com/tx/${video.editorPaymentTxSig}?cluster=${import.meta.env.VITE_SOLANA_NETWORK || "devnet"}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> View on Solana Explorer
                  </a>
                </div>
              ) : !publicKey ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Connect your Solana wallet to pay the editor directly on-chain.</p>
                  <WalletMultiButton style={{ background: "#4f46e5", borderRadius: "8px", fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "13px", height: "36px", width: "100%" }} />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount (SOL)</p>
                    <input
                      type="number"
                      min="0.001"
                      step="0.001"
                      value={payEditorAmount}
                      onChange={(e) => setPayEditorAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-[var(--radius-4)] border border-border text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring/20"
                    />
                  </div>
                  <button
                    onClick={payEditor}
                    disabled={isPayingEditor || !payEditorAmount}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-[var(--radius-4)] bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-colors disabled:opacity-60"
                  >
                    {isPayingEditor ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                    ) : (
                      <><Send className="w-4 h-4" /> Send {payEditorAmount} SOL</>
                    )}
                  </button>
                  <p className="text-xs text-muted-foreground text-center">
                    Payment goes directly to the editor's Solana wallet on-chain.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* NFT Certificate card — show when minted */}
          {video.nftMintAddress && (
            <div className="bg-card border border-border rounded-[var(--radius-4)] p-5 shadow-[var(--shadow-2)] space-y-3">
              <h3 className="text-[15px] font-bold text-foreground flex items-center gap-2 pb-3 border-b border-border">
                🏆 Delivery Certificate
              </h3>
              <div className="flex items-center gap-2 text-[var(--green-4)] text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-semibold">NFT minted on Solana</span>
              </div>
              <a
                href={`https://explorer.solana.com/address/${video.nftMintAddress}?cluster=${import.meta.env.VITE_SOLANA_NETWORK || "devnet"}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" /> View certificate on Explorer
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
