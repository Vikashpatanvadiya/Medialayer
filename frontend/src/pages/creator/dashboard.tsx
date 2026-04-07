import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useListVideos } from "@workspace/api-client-react";
import { VideoCard } from "@/components/ui/video-card";
import { Loader2, Video as VideoIcon, Clock, CheckCircle2, Upload, XCircle, Trash2, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { apiUrl } from "@/lib/api";
import { ResponsiveContainer, LineChart, Line, Tooltip } from "recharts";

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
    { label: "Needs Review", value: pending.length, icon: Clock, color: "text-[var(--amber-4)]", bg: "bg-[var(--amber-1)]" },
    { label: "Approved", value: approved.length, icon: CheckCircle2, color: "text-[var(--green-4)]", bg: "bg-[var(--green-1)]" },
    { label: "Uploaded", value: uploaded.length, icon: Upload, color: "text-[var(--sky-4)]", bg: "bg-[var(--sky-1)]" },
    { label: "Rejected", value: rejected.length, icon: XCircle, color: "text-[var(--red-4)]", bg: "bg-[var(--red-1)]" },
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
        <h1 className="text-[28px] font-bold text-foreground leading-tight">
          Welcome back, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-muted-foreground mt-1 text-base">Here's what's happening with your videos today.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-7 h-7 text-primary animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats — single wide card with 4 columns + dynamic sparklines */}
          <div className="bg-card border border-border rounded-[var(--radius-5)] shadow-[var(--shadow-2)] overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
              {(() => {
                // Build dynamic sparkline data from real videos
                // Group videos by day for the last 7 days
                const now = new Date();
                const days = Array.from({ length: 7 }, (_, i) => {
                  const d = new Date(now);
                  d.setDate(d.getDate() - (6 - i));
                  return d.toDateString();
                });

                const countByDay = (filterFn: (v: any) => boolean) =>
                  days.map((day, i) => ({
                    i,
                    day,
                    v: videos.filter(filterFn).filter(v => new Date(v.createdAt).toDateString() === day).length,
                  }));

                const startLabel = new Date(now.getTime() - 6 * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                const endLabel = now.toLocaleDateString("en-US", { month: "short", day: "numeric" });

                return [
                  {
                    label: "Needs Review",
                    value: pending.length,
                    color: "var(--amber-4)",
                    data: countByDay(v => v.status === "pending"),
                  },
                  {
                    label: "Approved",
                    value: approved.length,
                    color: "var(--green-4)",
                    data: countByDay(v => v.status === "approved"),
                  },
                  {
                    label: "Published to YouTube",
                    value: uploaded.length,
                    color: "var(--purple-4)",
                    data: countByDay(v => v.status === "uploaded"),
                  },
                  {
                    label: "Rejected",
                    value: rejected.length,
                    color: "var(--red-4)",
                    data: countByDay(v => v.status === "rejected"),
                  },
                ].map((stat) => (
                  <div key={stat.label} className="p-5 flex flex-col">
                    <p className="text-4xl font-bold text-foreground mb-0.5" style={{ letterSpacing: "-0.03em" }}>
                      {stat.value}
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">{stat.label}</p>
                    <div className="h-12 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stat.data}>
                          <Line
                            type="monotone"
                            dataKey="v"
                            stroke={stat.color}
                            strokeWidth={1.5}
                            dot={false}
                            strokeDasharray={stat.value === 0 ? "3 2" : undefined}
                          />
                          <Tooltip
                            contentStyle={{
                              background: "var(--bg-1)",
                              border: "1px solid var(--gray-2)",
                              borderRadius: "var(--radius-3)",
                              fontSize: "11px",
                              padding: "4px 8px",
                            }}
                            cursor={{ stroke: "var(--gray-2)", strokeWidth: 1 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Date range labels */}
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-muted-foreground">{startLabel}</span>
                      <span className="text-[10px] text-muted-foreground">{endLabel}</span>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Needs Review — brief: ~20px bold section heading, 48–64px section gap */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[20px] font-bold text-foreground flex items-center gap-2">
                <Clock className="w-5 h-5 text-[var(--amber-4)]" />
                Needs Review
                {pending.length > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-[10px] text-white font-bold">
                    {pending.length}
                  </span>
                )}
              </h2>
              <Link href="/dashboard/creator/videos">
                <span className="text-sm text-primary hover:underline cursor-pointer font-medium">View all →</span>
              </Link>
            </div>

            {pending.length === 0 ? (
              <div className="bg-card border border-border rounded-[var(--radius-4)] p-10 flex flex-col items-center text-center shadow-[var(--shadow-2)]">
                <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mb-4">
                  <VideoIcon className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="font-bold text-foreground mb-1">Inbox zero!</h3>
                <p className="text-muted-foreground text-sm">No videos waiting for review right now.</p>
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
              <h2 className="text-[20px] font-bold text-foreground flex items-center gap-2 mb-6">
                <CheckCircle2 className="w-5 h-5 text-[var(--green-4)]" />
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
          <div className="relative bg-card rounded-[var(--radius-4)] shadow-[var(--shadow-3)] border border-border w-full max-w-md p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-[var(--red-1)] flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-7 h-7 text-[var(--red-4)]" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Delete this video?</h2>
            <p className="text-muted-foreground text-sm mb-1">You're about to permanently delete:</p>
            <p className="font-semibold text-foreground mb-4">"{deleteTarget.title}"</p>
            <p className="text-xs text-muted-foreground mb-8">This cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-[var(--radius-4)] border border-border text-foreground text-sm font-semibold hover:bg-muted/50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-[var(--radius-4)] bg-[var(--red-4)] hover:bg-[var(--red-3)] text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
