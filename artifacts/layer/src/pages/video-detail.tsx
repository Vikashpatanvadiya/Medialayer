import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useGetVideo, useApproveVideo, useRejectVideo } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, X, Loader2, ExternalLink, Calendar, User as UserIcon, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BeautifulBadge } from "@/components/ui/beautiful-badge";
import { getStatusColor, getThumbnailUrl } from "@/components/ui/video-card";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

function extractYoutubeEmbed(url: string) {
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }
  return null;
}

export default function VideoDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [rejectFeedback, setRejectFeedback] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const { data: video, isLoading, error } = useGetVideo(id, {
    query: { enabled: !!id && !!user }
  });

  const approveMutation = useApproveVideo({
    mutation: {
      onSuccess: () => {
        toast({ title: "Video Approved!" });
        queryClient.invalidateQueries({ queryKey: [`/api/videos/${id}`] });
        queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
      }
    }
  });

  const rejectMutation = useRejectVideo({
    mutation: {
      onSuccess: () => {
        toast({ title: "Video Rejected", description: "Feedback sent to editor." });
        queryClient.invalidateQueries({ queryKey: [`/api/videos/${id}`] });
        queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
        setShowRejectForm(false);
        setRejectFeedback("");
      }
    }
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full text-center">
        <h2 className="text-2xl font-bold">Video Not Found</h2>
        <p className="text-muted-foreground mt-2 mb-6">The video you're looking for doesn't exist or you don't have access.</p>
        <Button onClick={() => setLocation(`/dashboard/${user?.role}`)}>Back to Dashboard</Button>
      </div>
    );
  }

  const isCreator = user?.role === 'creator';
  const embedUrl = extractYoutubeEmbed(video.videoUrl);
  const backPath = `/dashboard/${user?.role}`;

  return (
    <div className="h-full flex flex-col pb-10">
      <div className="mb-6">
        <Link href={backPath} className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-display font-bold text-foreground">{video.title}</h1>
              <BeautifulBadge variant={getStatusColor(video.status)} className="capitalize text-sm px-3 py-1">
                {video.status}
              </BeautifulBadge>
            </div>
          </div>

          {/* Action Buttons for Creator */}
          {isCreator && video.status === 'pending' && !showRejectForm && (
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowRejectForm(true)}
                className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors px-6"
              >
                <X className="w-4 h-4 mr-2" /> Reject
              </Button>
              <Button 
                onClick={() => approveMutation.mutate({ id })}
                disabled={approveMutation.isPending}
                className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 border-none px-6"
              >
                {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                Approve Video
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Player */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-black rounded-3xl overflow-hidden shadow-2xl aspect-video border border-border/50">
            {embedUrl ? (
              <iframe 
                src={embedUrl} 
                className="w-full h-full" 
                allowFullScreen 
                title="Video Player"
              />
            ) : (
              <div className="w-full h-full relative group flex flex-col items-center justify-center">
                 <img src={getThumbnailUrl(video.thumbnailUrl, video.videoUrl)} alt="Thumbnail" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                 <div className="relative z-10 text-center">
                    <a href={video.videoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/90 text-white shadow-xl hover:scale-110 transition-transform mb-4">
                      <Play className="w-8 h-8 ml-1 fill-white" />
                    </a>
                    <p className="text-white font-medium">Click to open external link</p>
                 </div>
              </div>
            )}
          </div>

          <div className="bg-card p-6 rounded-3xl border border-border/50 premium-shadow">
            <h3 className="text-xl font-display font-bold mb-4">Description</h3>
            <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap font-sans">
              {video.description || "No description provided."}
            </p>
          </div>
        </div>

        {/* Right Col: Metadata & Action Forms */}
        <div className="space-y-6">
          
          <AnimatePresence>
            {showRejectForm && (
              <motion.div 
                initial={{ opacity: 0, height: 0, y: -20 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-destructive/5 border border-destructive/20 rounded-3xl p-6 overflow-hidden"
              >
                <h3 className="font-semibold text-destructive mb-2 flex items-center gap-2">
                  <X className="w-5 h-5" /> Request Changes
                </h3>
                <textarea 
                  value={rejectFeedback}
                  onChange={(e) => setRejectFeedback(e.target.value)}
                  className="w-full mt-3 px-4 py-3 rounded-xl bg-background border border-destructive/20 focus:border-destructive focus:ring-4 focus:ring-destructive/10 text-foreground resize-none transition-all"
                  rows={4}
                  placeholder="Tell the editor what needs to be fixed..."
                />
                <div className="flex justify-end gap-3 mt-4">
                  <Button variant="ghost" onClick={() => setShowRejectForm(false)} className="rounded-xl">Cancel</Button>
                  <Button 
                    variant="destructive" 
                    className="rounded-xl"
                    disabled={!rejectFeedback.trim() || rejectMutation.isPending}
                    onClick={() => rejectMutation.mutate({ id, data: { feedback: rejectFeedback } })}
                  >
                    {rejectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Feedback"}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {video.status === 'rejected' && video.rejectionFeedback && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-3xl p-6">
              <h3 className="font-semibold text-destructive mb-3 flex items-center gap-2">
                <X className="w-5 h-5" /> Rejection Feedback
              </h3>
              <p className="text-sm text-destructive-foreground/80 leading-relaxed italic border-l-2 border-destructive/40 pl-3">
                "{video.rejectionFeedback}"
              </p>
            </div>
          )}

          <div className="bg-card p-6 rounded-3xl border border-border/50 premium-shadow space-y-6">
            <h3 className="text-lg font-display font-bold border-b border-border/50 pb-4">Details</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground shrink-0 mt-0.5">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Editor</p>
                  <p className="text-sm text-muted-foreground">{video.editor?.name || "Unknown"}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground shrink-0 mt-0.5">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Submitted</p>
                  <p className="text-sm text-muted-foreground">{format(new Date(video.createdAt), "MMM d, yyyy 'at' h:mm a")}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground shrink-0 mt-0.5">
                  <ExternalLink className="w-4 h-4" />
                </div>
                <div className="w-full overflow-hidden">
                  <p className="text-sm font-medium text-foreground">Raw Video Link</p>
                  <a href={video.videoUrl} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline truncate block">
                    {video.videoUrl}
                  </a>
                </div>
              </div>
            </div>

            {video.tags && video.tags.length > 0 && (
              <div className="pt-4 border-t border-border/50">
                <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4" /> Tags
                </p>
                <div className="flex flex-wrap gap-2">
                  {video.tags.map(t => (
                    <span key={t} className="px-2.5 py-1 bg-secondary text-secondary-foreground rounded-md text-xs font-medium border border-border/50">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

// Ensure Play icon is defined
function Play(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  )
}
