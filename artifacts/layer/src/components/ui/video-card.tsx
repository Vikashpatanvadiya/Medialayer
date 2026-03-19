import { Video } from "@workspace/api-client-react";
import { formatDistanceToNow } from "date-fns";
import { BeautifulBadge } from "./beautiful-badge";
import { Play, MessageSquare, Clock } from "lucide-react";
import { Link } from "wouter";

export function getStatusColor(status: string) {
  switch (status) {
    case 'approved': return 'success';
    case 'rejected': return 'destructive';
    case 'uploaded': return 'info';
    default: return 'warning';
  }
}

export function getThumbnailUrl(url: string | undefined, defaultVideoUrl: string) {
  if (url) return url;
  // Try to extract youtube ID
  const ytMatch = defaultVideoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/);
  if (ytMatch && ytMatch[1]) {
    return `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`;
  }
  // Fallback stock image specifically for video placeholders
  // stock video editing setup abstract
  return "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&q=80";
}

export function VideoCard({ video, rolePath }: { video: Video, rolePath: string }) {
  const thumb = getThumbnailUrl(video.thumbnailUrl, video.videoUrl);

  return (
    <Link href={`/dashboard/${rolePath}/video/${video.id}`}>
      <div className="group cursor-pointer bg-card border border-border/50 rounded-2xl overflow-hidden premium-shadow flex flex-col h-full hover:border-primary/30">
        <div className="relative aspect-video overflow-hidden bg-muted">
          <img 
            src={thumb} 
            alt={video.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:scale-110 duration-300">
              <Play className="w-5 h-5 text-white ml-1 fill-white" />
            </div>
          </div>
          <div className="absolute top-3 right-3">
            <BeautifulBadge variant={getStatusColor(video.status)} className="capitalize backdrop-blur-md shadow-lg border-none">
              {video.status}
            </BeautifulBadge>
          </div>
        </div>
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="font-display font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">{video.title}</h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed flex-1">
            {video.description || "No description provided."}
          </p>
          
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-secondary-foreground">
                {(video.editor?.name || "E").charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-medium text-muted-foreground truncate max-w-[100px]">
                {video.editor?.name || "Editor"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <Clock className="w-3.5 h-3.5" />
              {formatDistanceToNow(new Date(video.createdAt))} ago
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
