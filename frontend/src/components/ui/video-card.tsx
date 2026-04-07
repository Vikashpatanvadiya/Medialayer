import { Video } from "@workspace/api-client-react";
import { formatDistanceToNow } from "date-fns";
import { Play, Clock, Trash2 } from "lucide-react";
import { Link } from "wouter";

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  pending:  { bg: "var(--amber-1)",  color: "var(--amber-4)"  },
  approved: { bg: "var(--green-1)",  color: "var(--green-4)"  },
  rejected: { bg: "var(--red-1)",    color: "var(--red-4)"    },
  uploaded: { bg: "var(--sky-1)",    color: "var(--sky-4)"    },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? { bg: "var(--bg-3)", color: "var(--fg-3)" };
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize backdrop-blur-sm"
      style={{ background: s.bg, color: s.color }}
    >
      {status}
    </span>
  );
}

export function getThumbnailUrl(url: string | undefined, defaultVideoUrl: string) {
  if (url) return url;
  const ytMatch = defaultVideoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/);
  if (ytMatch && ytMatch[1]) {
    return `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`;
  }
  return "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&q=80";
}

interface VideoCardProps {
  video: Video;
  rolePath: string;
  onDelete?: (id: string) => void;
}

export function VideoCard({ video, rolePath, onDelete }: VideoCardProps) {
  const thumb = getThumbnailUrl(video.thumbnailUrl, video.videoUrl);
  const canDelete = onDelete && video.status !== 'uploaded';

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.(video.id);
  };

  return (
    <Link href={`/dashboard/${rolePath}/video/${video.id}`}>
      <div className="group cursor-pointer bg-card border border-border rounded-[var(--radius-4)] overflow-hidden flex flex-col h-full shadow-[var(--shadow-2)] hover:shadow-[var(--shadow-3)] transition-shadow relative">
        <div className="relative aspect-video overflow-hidden bg-muted">
          <img
            src={thumb}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-card/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:scale-110 duration-300">
              <Play className="w-5 h-5 text-white ml-1 fill-white" />
            </div>
          </div>
          <div className="absolute top-3 right-3">
            <StatusBadge status={video.status} />
          </div>

          {canDelete && (
            <button
              onClick={handleDelete}
              title="Delete video"
              className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive text-white z-10"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="p-5 flex-1 flex flex-col">
          <h3 className="font-semibold text-base text-foreground line-clamp-1 group-hover:text-primary transition-colors">{video.title}</h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed flex-1">
            {video.description || "No description provided."}
          </p>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
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
