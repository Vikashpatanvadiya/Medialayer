import { Video } from "@workspace/api-client-react";
import { formatDistanceToNow } from "date-fns";
import { BeautifulBadge } from "./beautiful-badge";
import { Play, Clock, Trash2 } from "lucide-react";
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
      <div className="group cursor-pointer bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col h-full shadow-[0px_4px_8px_rgba(0,0,0,0.08)] hover:shadow-[0px_6px_16px_rgba(0,0,0,0.12)] transition-shadow relative">
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
          <h3 className="font-semibold text-base text-[#333] line-clamp-1 group-hover:text-violet-600 transition-colors">{video.title}</h3>
          <p className="text-sm text-[#6c757d] mt-1 line-clamp-2 leading-relaxed flex-1">
            {video.description || "No description provided."}
          </p>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                {(video.editor?.name || "E").charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-medium text-[#6c757d] truncate max-w-[100px]">
                {video.editor?.name || "Editor"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#6c757d] font-medium">
              <Clock className="w-3.5 h-3.5" />
              {formatDistanceToNow(new Date(video.createdAt))} ago
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
