import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useListVideos } from "@workspace/api-client-react";
import { VideoCard } from "@/components/ui/video-card";
import { Loader2, Video as VideoIcon, Clock, CheckCircle2, Upload, XCircle, Trash2, AlertTriangle, Copy, Check } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { apiUrl } from "@/lib/api";

export default function CreatorDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("layer_token");
    fetch(apiUrl("/api/users/invite-code"), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setInviteCode(d.inviteCode))
      .catch(() => {});
  }, []);

  const copyCode = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!", description: "Share this code with your editors." });
  };

  const { data, isLoading } = useListVideos(undefined, {
    query: { enabled: !!user, queryKey: ["/api/videos"] },
  });
  const videos = data?.videos || [];

  const pending = videos.filter((v) => v.status === "pending");
  const approved = videos.filter((v) => v.status === "approved");
  const uploaded = videos.filter((v) => v.status === "uploaded");
  const rejected = videos.filter((v) => v.status === "rejected");

  const stats = [
    { label: "Needs Review", value: pending.length, icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "Approved", value: approved.length, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Uploaded", value: uploaded.length, icon: Upload, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Rejected", value: rejected.length, icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
  ];

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
    <div className="space-y-12">

      {/* Welcome — brief: ~28px bold #333 heading */}
      <div>
        <h1 className="text-[28px] font-bold text-[#333] leading-tight">
          Welcome back, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-[#6c757d] mt-1 text-base">Here's what's happening with your videos today.</p>
      </div>

      {/* Invite Code Banner — brief: purple primary CTA, 8px radius */}
      {inviteCode && (
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-[0px_4px_8px_rgba(0,0,0,0.06)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#333]">Your Editor Invite Code</p>
            <p className="text-sm text-[#6c757d] mt-0.5">Share this code with editors so they can link to your account</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xl font-bold tracking-widest text-violet-700 bg-violet-50 px-4 py-2 rounded-lg border border-violet-200">
              {inviteCode}
            </span>
            {/* Brief: solid purple primary button, white text, 8px radius */}
            <button
              onClick={copyCode}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors shadow-sm"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-7 h-7 text-violet-600 animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats — brief: white cards, 8px radius, 0px 4px 8px shadow, 24px gap */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-white border border-gray-200 rounded-lg p-5 flex items-center gap-4 shadow-[0px_4px_8px_rgba(0,0,0,0.06)]"
              >
                <div className={`w-11 h-11 rounded-lg ${stat.bg} flex items-center justify-center shrink-0`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#333]">{stat.value}</p>
                  <p className="text-xs text-[#6c757d] font-medium mt-0.5">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Needs Review — brief: ~20px bold section heading, 48–64px section gap */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[20px] font-bold text-[#333] flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                Needs Review
                {pending.length > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-violet-600 text-[10px] text-white font-bold">
                    {pending.length}
                  </span>
                )}
              </h2>
              <Link href="/dashboard/creator/videos">
                <span className="text-sm text-violet-600 hover:underline cursor-pointer font-medium">View all →</span>
              </Link>
            </div>

            {pending.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-10 flex flex-col items-center text-center shadow-[0px_4px_8px_rgba(0,0,0,0.06)]">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <VideoIcon className="w-7 h-7 text-gray-400" />
                </div>
                <h3 className="font-bold text-[#333] mb-1">Inbox zero!</h3>
                <p className="text-[#6c757d] text-sm">No videos waiting for review right now.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {pending.map((video) => (
                  <VideoCard key={video.id} video={video} rolePath="creator" onDelete={handleDeleteRequest} />
                ))}
              </div>
            )}
          </div>

          {/* Ready to Upload */}
          {approved.length > 0 && (
            <div>
              <h2 className="text-[20px] font-bold text-[#333] flex items-center gap-2 mb-6">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Ready to Upload
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {approved.map((video) => (
                  <VideoCard key={video.id} video={video} rolePath="creator" onDelete={handleDeleteRequest} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete modal — brief: 8px radius, white surface, subtle shadow */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !isDeleting && setDeleteTarget(null)}
          />
          <div className="relative bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-md p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-[#333] mb-2">Delete this video?</h2>
            <p className="text-[#6c757d] text-sm mb-1">You're about to permanently delete:</p>
            <p className="font-semibold text-[#333] mb-4">"{deleteTarget.title}"</p>
            <p className="text-xs text-[#6c757d] mb-8">This cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Deleting…</>
                ) : (
                  <><Trash2 className="w-4 h-4" />Delete</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
