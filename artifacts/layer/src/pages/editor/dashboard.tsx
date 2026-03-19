import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useListVideos } from "@workspace/api-client-react";
import { VideoCard } from "@/components/ui/video-card";
import { Plus, Loader2, Video as VideoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import NewSubmissionModal from "./new-submission";

export default function EditorDashboard() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading } = useListVideos({
    query: { enabled: !!user }
  });

  const videos = data?.videos || [];
  const filteredVideos = filter === "all" ? videos : videos.filter(v => v.status === filter);

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">My Submissions</h1>
          <p className="text-muted-foreground mt-1">Manage and track your video edits.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="btn-primary-gradient rounded-xl px-6 h-12 font-semibold">
          <Plus className="w-5 h-5 mr-2" />
          New Submission
        </Button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {['all', 'pending', 'approved', 'rejected'].map(f => (
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
          <h3 className="text-xl font-display font-bold mb-2">No videos found</h3>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            {filter === 'all' 
              ? "You haven't submitted any videos yet. Click 'New Submission' to get started." 
              : `You have no ${filter} videos at the moment.`}
          </p>
          {filter !== 'all' && (
            <Button variant="outline" onClick={() => setFilter('all')}>View All</Button>
          )}
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {filteredVideos.map((video) => (
            <VideoCard key={video.id} video={video} rolePath="editor" />
          ))}
        </motion.div>
      )}

      {isModalOpen && <NewSubmissionModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}
