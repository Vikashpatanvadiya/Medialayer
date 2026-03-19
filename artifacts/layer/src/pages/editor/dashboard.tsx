import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useListVideos } from "@workspace/api-client-react";
import { VideoCard } from "@/components/ui/video-card";
import { Plus, Loader2, Video as VideoIcon, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import NewSubmissionModal from "./new-submission";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

export default function EditorDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, isLoading } = useListVideos({
    query: { enabled: !!user },
  });

  const videos = data?.videos || [];
  const filteredVideos = filter === "all" ? videos : videos.filter((v) => v.status === filter);

  const handleDeleteRequest = (id: string) => {
    const video = videos.find((v) => v.id === id);
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
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Submissions</h1>
          <p className="text-muted-foreground mt-1">Manage and track your video edits.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="rounded-xl px-6 h-12 font-semibold">
          <Plus className="w-5 h-5 mr-2" />
          New Submission
        </Button>
      </div>

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
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-6 shadow-inner border border-border/50">
            <VideoIcon className="w-10 h-10 text-muted-foreground opacity-50" />
          </div>
          <h3 className="text-xl font-bold mb-2">No videos found</h3>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            {filter === "all"
              ? "You haven't submitted any videos yet. Click 'New Submission' to get started."
              : `You have no ${filter} videos at the moment.`}
          </p>
          {filter !== "all" && (
            <Button variant="outline" onClick={() => setFilter("all")}>View All</Button>
          )}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {filteredVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              rolePath="editor"
              onDelete={handleDeleteRequest}
            />
          ))}
        </motion.div>
      )}

      {isModalOpen && <NewSubmissionModal onClose={() => setIsModalOpen(false)} />}

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !isDeleting && setDeleteTarget(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-card rounded-3xl shadow-2xl border border-border/50 w-full max-w-md p-8 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-5">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-xl font-bold mb-2">Delete this video?</h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-1">
                You're about to permanently delete:
              </p>
              <p className="font-semibold text-foreground mb-6 px-4">"{deleteTarget.title}"</p>
              <p className="text-xs text-muted-foreground mb-8">
                This will remove the video file and submission. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 rounded-xl"
                  onClick={confirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Deleting…</>
                  ) : (
                    <><Trash2 className="w-4 h-4 mr-2" /> Delete</>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
