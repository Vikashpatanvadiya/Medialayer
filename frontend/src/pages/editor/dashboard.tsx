import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useListVideos } from "@workspace/api-client-react";
import { VideoCard } from "@/components/ui/video-card";
import {
  Plus, Loader2, Video as VideoIcon, Clock, CheckCircle2,
  Upload, XCircle, Link2, AlertCircle, X, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import NewSubmissionModal from "./new-submission";
import { Link } from "wouter";
import { toast } from "@/hooks/use-toast";
import { apiUrl } from "@/lib/api";
import { format } from "date-fns";

type LinkedCreator = { id: string; name: string; email: string };

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-[var(--amber-1)] text-amber-700 border-[var(--amber-2)]",
  approved: "bg-[var(--green-1)] text-[var(--green-4)] border-[var(--green-2)]",
  uploaded: "bg-[var(--sky-1)] text-[var(--sky-4)] border-[var(--sky-2)]",
  rejected: "bg-[var(--red-1)] text-[var(--red-4)] border-[var(--red-2)]",
};

export default function EditorDashboard() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [linkedCreators, setLinkedCreators] = useState<LinkedCreator[]>([]);
  const [loadingCreators, setLoadingCreators] = useState(true);
  const [removingCreator, setRemovingCreator] = useState<string | null>(null);
  const [selectedCreator, setSelectedCreator] = useState<LinkedCreator | null>(null);

  const fetchLinkedCreators = async () => {
    const token = localStorage.getItem("layer_token");
    try {
      const res = await fetch(apiUrl("/api/users/my-creators"), { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setLinkedCreators(data.creators || []);
    } catch {}
    setLoadingCreators(false);
  };

  useEffect(() => { fetchLinkedCreators(); }, []);

  const unlinkCreator = async (creatorId: string, creatorName: string) => {
    if (!confirm(`Unlink from ${creatorName}?`)) return;
    setRemovingCreator(creatorId);
    try {
      const token = localStorage.getItem("layer_token");
      const res = await fetch(apiUrl(`/api/users/unlink-creator/${creatorId}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to unlink");
      setLinkedCreators((prev) => prev.filter((c) => c.id !== creatorId));
      if (selectedCreator?.id === creatorId) setSelectedCreator(null);
      toast({ title: "Unlinked", description: `You've been unlinked from ${creatorName}.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setRemovingCreator(null);
    }
  };

  const linkCreator = async () => {
    if (!inviteCode.trim()) return;
    setIsLinking(true);
    try {
      const token = localStorage.getItem("layer_token");
      const res = await fetch(apiUrl("/api/users/link-creator"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to link");
      toast({ title: "Linked!", description: `You're now linked to ${data.creatorName}.` });
      setInviteCode("");
      fetchLinkedCreators();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLinking(false);
    }
  };

  const isLinked = linkedCreators.length > 0;

  const { data, isLoading } = useListVideos(undefined, {
    query: { enabled: !!user, queryKey: ["/api/videos"] },
  });

  const allVideos = data?.videos || [];

  // Filter by selected creator
  const videos = selectedCreator
    ? allVideos.filter(v => v.creatorId === selectedCreator.id)
    : allVideos;

  const pending = allVideos.filter(v => v.status === "pending");
  const approved = allVideos.filter(v => v.status === "approved");
  const uploaded = allVideos.filter(v => v.status === "uploaded");
  const rejected = allVideos.filter(v => v.status === "rejected");

  const stats = [
    { label: "Pending Review", value: pending.length, icon: Clock, color: "text-[var(--amber-4)]", bg: "bg-[var(--amber-1)]", border: "border-amber-100" },
    { label: "Approved", value: approved.length, icon: CheckCircle2, color: "text-[var(--green-4)]", bg: "bg-[var(--green-1)]", border: "border-emerald-100" },
    { label: "Uploaded", value: uploaded.length, icon: Upload, color: "text-[var(--sky-4)]", bg: "bg-[var(--sky-1)]", border: "border-[var(--sky-2)]" },
    { label: "Rejected", value: rejected.length, icon: XCircle, color: "text-[var(--red-4)]", bg: "bg-[var(--red-1)]", border: "border-[var(--red-2)]" },
  ];

  const recent = [...videos].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">Here's an overview of your submissions.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={!isLinked}
          className="flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-5)] bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-colors disabled:opacity-40 shadow-[var(--shadow-1)] shadow-primary/10 shrink-0"
        >
          <Plus className="w-4 h-4" /> New Submission
        </button>
      </div>

      {/* My Creators */}
      <div className="bg-white border border-border rounded-[var(--radius-6)] p-5 shadow-[0px_2px_8px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm font-bold text-foreground">My Creators</span>
          {isLinked && (
            <span className="text-xs bg-accent text-primary border border-primary/10 px-2 py-0.5 rounded-full font-semibold">
              {linkedCreators.length} linked
            </span>
          )}
        </div>

        {/* Creator chips — clickable to filter */}
        {!loadingCreators && linkedCreators.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {linkedCreators.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCreator(selectedCreator?.id === c.id ? null : c)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  selectedCreator?.id === c.id
                    ? "bg-primary text-white border-primary shadow-[var(--shadow-1)]"
                    : "bg-[var(--green-1)] text-[var(--green-4)] border-[var(--green-2)] hover:bg-emerald-100"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {c.name}
              </button>
            ))}
          </div>
        )}

        {/* Add creator input */}
        <div className="flex gap-2">
          <input
            value={inviteCode}
            onChange={e => setInviteCode(e.target.value.toUpperCase())}
            placeholder="Enter invite code to add a creator (e.g. A3K9PX2M)"
            className="flex-1 px-4 py-2.5 rounded-[var(--radius-5)] bg-muted/50 border border-border text-foreground font-mono tracking-widest placeholder:font-sans placeholder:tracking-normal placeholder:text-muted-foreground/70 text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring/20 transition-all"
            maxLength={8}
            onKeyDown={e => e.key === "Enter" && linkCreator()}
          />
          <button
            onClick={linkCreator}
            disabled={isLinking || !inviteCode.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-[var(--radius-5)] bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-colors disabled:opacity-40 shrink-0"
          >
            {isLinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Link2 className="w-4 h-4" /> Add</>}
          </button>
        </div>

        {!isLinked && !loadingCreators && (
          <div className="flex items-center gap-2 text-sm text-[var(--amber-4)] mt-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Link at least one creator to start submitting videos.
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={`bg-white border ${stat.border} rounded-[var(--radius-6)] p-4 flex items-center gap-3 shadow-[0px_2px_8px_rgba(0,0,0,0.04)]`}
          >
            <div className={`w-10 h-10 rounded-[var(--radius-5)] ${stat.bg} flex items-center justify-center shrink-0`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Needs Revision */}
      {rejected.length > 0 && !selectedCreator && (
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2 mb-3">
            <XCircle className="w-4 h-4 text-[var(--red-4)]" />
            Needs Revision
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--red-1)]0 text-[10px] text-white font-bold">{rejected.length}</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {rejected.map((video) => <VideoCard key={video.id} video={video} rolePath="editor" />)}
          </div>
        </div>
      )}

      {/* Videos section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <VideoIcon className="w-4 h-4 text-primary" />
            {selectedCreator ? `Videos for ${selectedCreator.name}` : "Recent Submissions"}
            {selectedCreator && (
              <button
                onClick={() => setSelectedCreator(null)}
                className="ml-1 text-xs text-muted-foreground/70 hover:text-muted-foreground flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear filter
              </button>
            )}
          </h2>
          {!selectedCreator && (
            <Link href="/dashboard/editor/submissions">
              <span className="text-sm text-primary hover:underline cursor-pointer font-medium">View all →</span>
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 text-primary animate-spin" />
          </div>
        ) : recent.length === 0 ? (
          <div className="bg-white border border-border rounded-[var(--radius-6)] p-10 flex flex-col items-center text-center shadow-[0px_2px_8px_rgba(0,0,0,0.04)]">
            <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mb-4">
              <VideoIcon className="w-7 h-7 text-muted-foreground/70" />
            </div>
            <h3 className="font-bold text-foreground mb-1">
              {selectedCreator ? `No videos for ${selectedCreator.name}` : "No submissions yet"}
            </h3>
            <p className="text-muted-foreground text-sm mb-5">
              {selectedCreator ? "Submit a video to this creator to get started." : "Upload your first video to get started."}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              disabled={!isLinked}
              className="flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-5)] bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-colors disabled:opacity-40"
            >
              <Plus className="w-4 h-4" /> New Submission
            </button>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {recent.map((video) => <VideoCard key={video.id} video={video} rolePath="editor" />)}
          </motion.div>
        )}
      </div>

      {isModalOpen && <NewSubmissionModal linkedCreators={linkedCreators} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}
