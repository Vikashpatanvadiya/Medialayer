import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useListVideos } from "@workspace/api-client-react";
import { VideoCard } from "@/components/ui/video-card";
import { Plus, Loader2, Video as VideoIcon, Trash2, AlertTriangle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import NewSubmissionModal from "./new-submission";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { apiUrl } from "@/lib/api";

type LinkedCreator = { id: string; name: string; email: string };

export default function AllSubmissions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [linkedCreators, setLinkedCreators] = useState<LinkedCreator[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("layer_token");
    fetch(apiUrl("/api/users/my-creators"), { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setLinkedCreators(d.creators || [])).catch(() => {});
  }, []);

  const { data, isLoading } = useListVideos(undefined, {
    query: { enabled: !!user, queryKey: ["/api/videos"] },
  });

  const videos = data?.videos || [];
  const filteredVideos = filter === "all" ? videos : videos.filter((v) => v.status === filter);

  // Group by creator
  const grouped = filteredVideos.reduce<Record<string, { creatorName: string; videos: typeof filteredVideos }>>((acc, video) => {
    const creatorId = video.creatorId;
    const creatorName = video.creator?.name || "Unknown Creator";
    if (!acc[creatorId]) acc[creatorId] = { creatorName, videos: [] };
    acc[creatorId].videos.push(video);
    return acc;
  }, {});

  const handleDeleteRequest = (id: string) => {
    const video = videos.find((v) => v.id === id);
    if (video) setDeleteTarget({ id, title: video.title });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem("layer_token");
      const res = await fetch(apiUrl(`/api/videos/${deleteTarget.id}`), {
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
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Submissions</h1>
          <p className="text-muted-foreground mt-1">Videos grouped by creator.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="rounded-xl px-6 h-12 font-semibold">
          <Plus className="w-5 h-5 mr-2" /> New Submission
        </Button>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {["all", "pending", "approved", "rejected", "uploaded"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-semibold capitalize whitespace-nowrap transition-all ${
              filter === f
                ? "bg-foreground text-background shadow-md"
                : "bg-card border border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            {f}
            <span className="ml-1.5 text-xs opacity-60">
              {f === "all" ? videos.length : videos.filter(v => v.status === f).length}
            </span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-6">
            <VideoIcon className="w-10 h-10 text-muted-foreground opacity-50" />
          </div>
          <h3 className="text-xl font-bold mb-2">No videos found</h3>
          <p className="text-muted-foreground mb-6">
            {filter === "all" ? "You haven't submitted any videos yet." : `No ${filter} videos at the moment.`}
          </p>
          {filter === "all" && (
            <Button onClick={() => setIsModalOpen(true)} className="rounded-xl px-6">
              <Plus className="w-4 h-4 mr-2" /> New Submission
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(grouped).map(([creatorId, { creatorName, videos: creatorVideos }]) => (
            <motion.div key={creatorId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              {/* Creator header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">{creatorName}</h2>
                  <p className="text-xs text-muted-foreground">{creatorVideos.length} video{creatorVideos.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {creatorVideos.map((video) => (
                  <VideoCard key={video.id} video={video} rolePath="editor" onDelete={handleDeleteRequest} />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {isModalOpen && <NewSubmissionModal linkedCreators={linkedCreators} onClose={() => setIsModalOpen(false)} />}

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
