import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useListVideos } from "@workspace/api-client-react";
import { VideoCard } from "@/components/ui/video-card";
import { Plus, Loader2, Video as VideoIcon, Clock, CheckCircle2, Upload, XCircle, Link2, AlertCircle, UserCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import NewSubmissionModal from "./new-submission";
import { Link } from "wouter";
import { toast } from "@/hooks/use-toast";

type LinkedCreator = { id: string; name: string; email: string };

export default function EditorDashboard() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [linkedCreators, setLinkedCreators] = useState<LinkedCreator[]>([]);
  const [loadingCreators, setLoadingCreators] = useState(true);
  const [removingCreator, setRemovingCreator] = useState<string | null>(null);

  const unlinkCreator = async (creatorId: string, creatorName: string) => {
    if (!confirm(`Unlink from ${creatorName}?`)) return;
    setRemovingCreator(creatorId);
    try {
      const res = await fetch(`/api/users/unlink-creator/${creatorId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to unlink");
      setLinkedCreators((prev) => prev.filter((c) => c.id !== creatorId));
      toast({ title: "Unlinked", description: `You've been unlinked from ${creatorName}.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setRemovingCreator(null);
    }
  };

  const fetchLinkedCreators = async () => {
    const token = localStorage.getItem("layer_token");
    try {
      const res = await fetch("/api/users/my-creators", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setLinkedCreators(data.creators || []);
    } catch {}
    setLoadingCreators(false);
  };

  useEffect(() => { fetchLinkedCreators(); }, []);

  const linkCreator = async () => {
    if (!inviteCode.trim()) return;
    setIsLinking(true);
    try {
      const token = localStorage.getItem("layer_token");
      const res = await fetch("/api/users/link-creator", {
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

  const videos = data?.videos || [];
  const pending = videos.filter(v => v.status === "pending");
  const approved = videos.filter(v => v.status === "approved");
  const uploaded = videos.filter(v => v.status === "uploaded");
  const rejected = videos.filter(v => v.status === "rejected");

  const stats = [
    { label: "Pending Review", value: pending.length, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Approved", value: approved.length, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Uploaded", value: uploaded.length, icon: Upload, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Rejected", value: rejected.length, icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
  ];

  const recent = [...videos].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4);

  return (
    <div className="h-full flex flex-col space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-muted-foreground mt-1">Here's an overview of your submissions.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} disabled={!isLinked} className="rounded-xl px-6 h-12 font-semibold shrink-0">
          <Plus className="w-5 h-5 mr-2" /> New Submission
        </Button>
      </div>

      {/* Creators section */}
      <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">My Creators</span>
            {isLinked && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{linkedCreators.length} linked</span>
            )}
          </div>
        </div>

        {/* Linked creators list */}
        {!loadingCreators && linkedCreators.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {linkedCreators.map(c => (
              <div key={c.id} className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-xl text-sm font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {c.name}
                <button
                  onClick={() => unlinkCreator(c.id, c.name)}
                  disabled={removingCreator === c.id}
                  className="ml-1 hover:text-destructive transition-colors"
                  title="Unlink creator"
                >
                  {removingCreator === c.id
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <X className="w-3 h-3" />
                  }
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add creator input */}
        <div className="flex gap-3">
          <input
            value={inviteCode}
            onChange={e => setInviteCode(e.target.value.toUpperCase())}
            placeholder="Enter invite code to add a creator (e.g. A3K9PX2M)"
            className="flex-1 px-4 py-2.5 rounded-xl bg-background border border-border text-foreground font-mono tracking-widest placeholder:font-sans placeholder:tracking-normal placeholder:text-muted-foreground text-sm"
            maxLength={8}
            onKeyDown={e => e.key === "Enter" && linkCreator()}
          />
          <Button onClick={linkCreator} disabled={isLinking || !inviteCode.trim()} className="rounded-xl px-5 shrink-0">
            {isLinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Link2 className="w-4 h-4 mr-2" />Add</>}
          </Button>
        </div>

        {!isLinked && !loadingCreators && (
          <div className="flex items-center gap-2 text-sm text-amber-600">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Link at least one creator to start submitting videos.
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
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

          {rejected.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-4">
                <XCircle className="w-5 h-5 text-destructive" />
                Needs Revision
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-destructive text-[11px] text-white font-bold">{rejected.length}</span>
              </h2>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {rejected.map((video) => <VideoCard key={video.id} video={video} rolePath="editor" />)}
              </motion.div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <VideoIcon className="w-5 h-5 text-primary" /> Recent Submissions
              </h2>
              <Link href="/dashboard/editor/submissions">
                <span className="text-sm text-primary hover:underline cursor-pointer">View all →</span>
              </Link>
            </div>

            {videos.length === 0 ? (
              <div className="bg-card border border-border/50 rounded-2xl p-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
                  <VideoIcon className="w-8 h-8 text-muted-foreground opacity-50" />
                </div>
                <h3 className="font-bold text-lg mb-1">No submissions yet</h3>
                <p className="text-muted-foreground text-sm mb-5">Upload your first video to get started.</p>
                <Button onClick={() => setIsModalOpen(true)} disabled={!isLinked} className="rounded-xl px-6">
                  <Plus className="w-4 h-4 mr-2" /> New Submission
                </Button>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {recent.map((video) => <VideoCard key={video.id} video={video} rolePath="editor" />)}
              </motion.div>
            )}
          </div>
        </>
      )}

      {isModalOpen && <NewSubmissionModal linkedCreators={linkedCreators} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}
