import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useListVideos } from "@workspace/api-client-react";
import { VideoCard } from "@/components/ui/video-card";
import { Loader2, Video as VideoIcon, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { apiUrl } from "@/lib/api";

export default function AllVideos() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, isLoading } = useListVideos(undefined, {
    query: { enabled: !!user, queryKey: ["/api/videos"] },
  });
  const videos = data?.videos || [];
  const filteredVideos = filter === "all" ? videos : videos.filter(v => v.status === filter);

  const handleDeleteRequest = (id: string) => {
    const video = videos.find(v => v.id === id);
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
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">All Videos</h1>
        <p className="text-muted-foreground mt-1">Every video submitted to you across all statuses.</p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {['all', 'pending', 'approved', 'rejected', 'uploaded'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-semibold capitalize whitespace-nowrap transition-all ${
              filter === f
                ? 'bg-foreground text-background shadow-md'
                : 'bg-card border border-border text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            {f}
            <span className="ml-2 text-xs opacity-60">
              {f === 'all' ? videos.length : videos.filter(v => v.status === f).length}
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
          <img src="/empty.png" alt="No videos" className="w-72 h-72 object-contain mb-2" style={{ mixBlendMode: "multiply" }} />
          <h3 className="text-xl font-display font-bold mb-2">No videos found</h3>
          <p className="text-muted-foreground">No {filter === 'all' ? '' : filter} videos yet.</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {filteredVideos.map((video) => (
            <VideoCard key={video.id} video={video} rolePath="creator" onDelete={video.status !== "uploaded" ? handleDeleteRequest : undefined} />
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !isDeleting && setDeleteTarget(null)}
            />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-card rounded-3xl shadow-[var(--shadow-4)] border border-border/50 w-full max-w-md p-8 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-5">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-xl font-bold mb-2">Delete this video?</h2>
              <p className="text-muted-foreground text-sm mb-1">You're about to permanently delete:</p>
              <p className="font-semibold text-foreground mb-6">"{deleteTarget.title}"</p>
              <p className="text-xs text-muted-foreground mb-8">This cannot be undone.</p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-[var(--radius-5)]" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>Cancel</Button>
                <Button variant="destructive" className="flex-1 rounded-[var(--radius-5)]" onClick={confirmDelete} disabled={isDeleting}>
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
