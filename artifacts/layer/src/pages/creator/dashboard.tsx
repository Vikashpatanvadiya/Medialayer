import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useListVideos } from "@workspace/api-client-react";
import { VideoCard } from "@/components/ui/video-card";
import { Loader2, Video as VideoIcon } from "lucide-react";
import { motion } from "framer-motion";

export default function CreatorDashboard() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<string>("pending"); // Default to pending for creators

  const { data, isLoading } = useListVideos({
    query: { enabled: !!user }
  });

  const videos = data?.videos || [];
  const filteredVideos = filter === "all" ? videos : videos.filter(v => v.status === filter);

  return (
    <div className="h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">Review Queue</h1>
        <p className="text-muted-foreground mt-1">Review videos submitted by your editors.</p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {['pending', 'approved', 'rejected', 'all'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-semibold capitalize whitespace-nowrap transition-all ${
              filter === f 
                ? 'bg-foreground text-background shadow-md' 
                : 'bg-card border border-border text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            {f === 'pending' ? 'Needs Review' : f}
            {f === 'pending' && videos.filter(v => v.status === 'pending').length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-[10px] text-primary-foreground">
                {videos.filter(v => v.status === 'pending').length}
              </span>
            )}
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
          <h3 className="text-xl font-display font-bold mb-2">Inbox zero!</h3>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            {filter === 'pending' 
              ? "You have no videos waiting for review right now. Good job!" 
              : `No ${filter} videos found.`}
          </p>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {filteredVideos.map((video) => (
            <VideoCard key={video.id} video={video} rolePath="creator" />
          ))}
        </motion.div>
      )}
    </div>
  );
}
