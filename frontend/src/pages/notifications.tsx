import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useListNotifications, useMarkNotificationRead } from "@workspace/api-client-react";
import { useGetVideo } from "@workspace/api-client-react";
import { formatDistanceToNow, format } from "date-fns";
import { CheckCircle2, XCircle, Clock, X, Play, User, Calendar, ExternalLink, Loader2, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getThumbnailUrl } from "@/components/ui/video-card";
import { apiUrl } from "@/lib/api";

const tabs = ["All", "Pending Review", "Approved", "Rejected"];

function VideoDrawer({ videoId, onClose }: { videoId: string; onClose: () => void }) {
  const { data: video, isLoading } = useGetVideo(videoId, {
    query: { enabled: !!videoId },
  });
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoSrcLoading, setVideoSrcLoading] = useState(false);

  // Fetch signed URL
  useState(() => {
    if (!videoId) return;
    const token = localStorage.getItem("layer_token");
    if (!token) return;
    setVideoSrcLoading(true);
    fetch(apiUrl(`/api/stream/${videoId}/url?token=${token}`), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setVideoSrc(d.url))
      .catch(() => setVideoSrc(null))
      .finally(() => setVideoSrcLoading(false));
  });

  const embedUrl = (() => {
    const ytMatch = video?.youtubeUrl?.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/);
    if (ytMatch?.[1]) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    return null;
  })();

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        className="fixed right-0 top-0 h-full w-full max-w-[520px] bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200"
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            {video && (
              <>
                <h2 className="text-base font-bold text-[#333] line-clamp-1">{video.title}</h2>
                <p className="text-xs text-[#6c757d] mt-0.5">
                  {video.editor?.name} · {formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}
                </p>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 text-violet-600 animate-spin" />
            </div>
          ) : video ? (
            <>
              {/* Video player */}
              <div className="bg-black aspect-video w-full">
                {embedUrl ? (
                  <iframe src={embedUrl} className="w-full h-full" allowFullScreen title={video.title} />
                ) : videoSrcLoading ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                ) : videoSrc ? (
                  <video src={videoSrc} controls className="w-full h-full" controlsList="nodownload" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    <Play className="w-10 h-10 text-white/40" />
                    <p className="text-white/40 text-sm">No preview available</p>
                  </div>
                )}
              </div>

              {/* Video info */}
              <div className="px-6 py-5 space-y-5">
                {/* Status badge */}
                <div className="flex items-center gap-2">
                  {video.status === "approved" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                    </span>
                  )}
                  {video.status === "rejected" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-xs font-semibold">
                      <XCircle className="w-3.5 h-3.5" /> Rejected
                    </span>
                  )}
                  {video.status === "pending" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-semibold">
                      <Clock className="w-3.5 h-3.5" /> Pending Review
                    </span>
                  )}
                  {video.status === "uploaded" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold">
                      <ExternalLink className="w-3.5 h-3.5" /> Uploaded
                    </span>
                  )}
                </div>

                {/* Description */}
                {video.description && (
                  <p className="text-sm text-[#6c757d] leading-relaxed">{video.description}</p>
                )}

                {/* Meta */}
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-xs text-[#6c757d]">Editor</p>
                      <p className="text-sm font-medium text-[#333]">{video.editor?.name || "Unknown"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-xs text-[#6c757d]">Submitted</p>
                      <p className="text-sm font-medium text-[#333]">
                        {format(new Date(video.createdAt), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rejection feedback */}
                {video.status === "rejected" && video.rejectionFeedback && (
                  <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                    <p className="text-xs font-semibold text-red-600 mb-1">Rejection Feedback</p>
                    <p className="text-sm text-red-700 leading-relaxed italic">"{video.rejectionFeedback}"</p>
                  </div>
                )}

                {/* CTA */}
                <a
                  href={`/dashboard/${video.creatorId ? "creator" : "editor"}/video/${video.id}`}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors shadow-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Full Detail
                </a>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-[#6c757d] text-sm">
              Video not found
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}

function NotifIcon({ type }: { type: string }) {
  if (type.includes("approved")) return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  if (type.includes("rejected")) return <XCircle className="w-4 h-4 text-red-500" />;
  return <Clock className="w-4 h-4 text-amber-500" />;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("All");
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  const { data: notifData, refetch } = useListNotifications({
    query: { enabled: !!user, refetchInterval: 30000 },
  });

  const markRead = useMarkNotificationRead({
    mutation: { onSuccess: () => refetch() },
  });

  const notifications = notifData?.notifications || [];

  const filtered = notifications.filter((n) => {
    if (activeTab === "All") return true;
    if (activeTab === "Pending Review") return n.type.includes("pending");
    if (activeTab === "Approved") return n.type.includes("approved");
    if (activeTab === "Rejected") return n.type.includes("rejected");
    return true;
  });

  const handleNotifClick = (notif: any) => {
    if (!notif.read) markRead.mutate({ id: notif.id });
    if (notif.videoId) setSelectedVideoId(notif.videoId);
  };

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[28px] font-bold text-[#333]">Notifications</h1>
        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400">
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs — brief: underline style */}
      <div className="flex items-center gap-6 border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
              activeTab === tab
                ? "text-[#333] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-violet-600"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Notification list */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center shadow-[0px_4px_8px_rgba(0,0,0,0.06)]">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-6 h-6 text-gray-400" />
          </div>
          <p className="font-semibold text-[#333] mb-1">All caught up!</p>
          <p className="text-sm text-[#6c757d]">No notifications in this category.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((notif: any) => {
            const thumb = notif.videoThumbnailUrl || notif.videoUrl
              ? getThumbnailUrl(notif.videoThumbnailUrl, notif.videoUrl || "")
              : null;

            return (
              <div
                key={notif.id}
                onClick={() => handleNotifClick(notif)}
                className={`bg-white border rounded-lg overflow-hidden shadow-[0px_4px_8px_rgba(0,0,0,0.06)] cursor-pointer hover:shadow-[0px_6px_16px_rgba(0,0,0,0.1)] transition-shadow ${
                  !notif.read ? "border-violet-200" : "border-gray-200"
                }`}
              >
                {/* Notif header */}
                <div className="flex items-start gap-3 px-5 py-4">
                  {/* Sender avatar */}
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-700 shrink-0 mt-0.5">
                    {notif.senderName?.charAt(0)?.toUpperCase() ?? "M"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className={`text-sm ${!notif.read ? "font-semibold text-[#333]" : "text-[#333]"}`}>
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-violet-600 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#6c757d]">
                      <NotifIcon type={notif.type} />
                      <span>{formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>

                {/* Video thumbnail preview — ref: large video card below notif header */}
                {thumb && (
                  <div className="mx-5 mb-4 rounded-lg overflow-hidden border border-gray-100 bg-black aspect-video relative group">
                    <img
                      src={thumb}
                      alt={notif.videoTitle || "Video"}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Video meta row — ref: sender name · time · stats */}
                {notif.videoTitle && (
                  <div className="px-5 pb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center text-[10px] font-bold text-violet-700">
                        {notif.senderName?.charAt(0)?.toUpperCase() ?? "M"}
                      </div>
                      <span className="text-xs text-[#6c757d] font-medium">{notif.senderName}</span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-[#6c757d]">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                )}

                {notif.videoTitle && (
                  <div className="px-5 pb-4">
                    <p className="text-sm font-semibold text-[#333]">{notif.videoTitle}</p>
                    {notif.message && (
                      <p className="text-xs text-[#6c757d] mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                    )}
                  </div>
                )}

                {!notif.videoTitle && notif.message && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-[#6c757d] leading-relaxed">{notif.message}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Video detail drawer */}
      <AnimatePresence>
        {selectedVideoId && (
          <VideoDrawer
            videoId={selectedVideoId}
            onClose={() => setSelectedVideoId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
