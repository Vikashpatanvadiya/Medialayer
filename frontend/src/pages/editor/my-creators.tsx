import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useListVideos } from "@workspace/api-client-react";
import { VideoCard } from "@/components/ui/video-card";
import { Link2, Loader2, ArrowLeft, Video as VideoIcon, Clock, Upload, X, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { apiUrl } from "@/lib/api";
import NewSubmissionModal from "./new-submission";

type LinkedCreator = { id: string; name: string; email: string };

export default function MyCreators() {
  const { user } = useAuth();
  const [linkedCreators, setLinkedCreators] = useState<LinkedCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCreator, setSelectedCreator] = useState<LinkedCreator | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchLinkedCreators = async () => {
    const token = localStorage.getItem("layer_token");
    try {
      const res = await fetch(apiUrl("/api/users/my-creators"), { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setLinkedCreators(data.creators || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchLinkedCreators(); }, []);

  const linkCreator = async () => {
    if (!inviteCode.trim()) return;
    setIsLinking(true);
    try {
      const token = localStorage.getItem("layer_token");
      const res = await fetch(apiUrl("/api/users/link-creator"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to link");
      toast({ title: "Linked!", description: `You're now linked to ${data.creatorName}.` });
      setInviteCode("");
      fetchLinkedCreators();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLinking(false);
    }
  };

  const unlinkCreator = async (creatorId: string, creatorName: string) => {
    if (!confirm(`Unlink from ${creatorName}?`)) return;
    const token = localStorage.getItem("layer_token");
    await fetch(apiUrl(`/api/users/unlink-creator/${creatorId}`), { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setLinkedCreators(p => p.filter(c => c.id !== creatorId));
    if (selectedCreator?.id === creatorId) setSelectedCreator(null);
    toast({ title: "Unlinked" });
  };

  const { data: videosData } = useListVideos(undefined, {
    query: { enabled: !!user, queryKey: ["/api/videos"] },
  });
  const allVideos = videosData?.videos || [];

  // If a creator is selected, show their videos
  if (selectedCreator) {
    const creatorVideos = allVideos.filter(v => v.creatorId === selectedCreator.id);
    const pending = creatorVideos.filter(v => v.status === "pending").length;
    const approved = creatorVideos.filter(v => v.status === "approved").length;
    const uploaded = creatorVideos.filter(v => v.status === "uploaded").length;
    const rejected = creatorVideos.filter(v => v.status === "rejected").length;

    return (
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedCreator(null)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> My Creators
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-semibold text-gray-900">{selectedCreator.name}</span>
        </div>

        {/* Creator header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
              {selectedCreator.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{selectedCreator.name}</h1>
              <p className="text-sm text-gray-500">{creatorVideos.length} video{creatorVideos.length !== 1 ? "s" : ""} submitted</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => unlinkCreator(selectedCreator.id, selectedCreator.name)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold transition-colors"
            >
              <X className="w-4 h-4" /> Remove
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Submit Video
            </button>
          </div>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Pending", value: pending, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
            { label: "Approved", value: approved, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
            { label: "Uploaded", value: uploaded, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
            { label: "Rejected", value: rejected, color: "text-red-600", bg: "bg-red-50", border: "border-red-100" },
          ].map(s => (
            <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-3 text-center`}>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Videos */}
        {creatorVideos.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 flex flex-col items-center text-center">
            <img src="/empty.png" alt="No videos" className="w-40 h-40 object-contain mb-4 opacity-90" />
            <h3 className="font-bold text-gray-900 mb-1">No videos yet</h3>
            <p className="text-gray-500 text-sm mb-5">Submit your first video to {selectedCreator.name}.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" /> Submit Video
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {creatorVideos.map(video => (
              <VideoCard key={video.id} video={video} rolePath="editor" />
            ))}
          </div>
        )}

        {isModalOpen && (
          <NewSubmissionModal
            linkedCreators={linkedCreators}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </div>
    );
  }

  // Creator list view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Creators</h1>
          <p className="text-gray-500 text-sm mt-0.5">Click a creator to see videos you've submitted to them.</p>
        </div>
      </div>

      {/* Add creator */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-[0px_2px_8px_rgba(0,0,0,0.04)]">
        <p className="text-sm font-semibold text-gray-700 mb-3">Add a creator by invite code</p>
        <div className="flex gap-2">
          <input
            value={inviteCode}
            onChange={e => setInviteCode(e.target.value.toUpperCase())}
            placeholder="Enter invite code (e.g. A3K9PX2M)"
            className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 font-mono tracking-widest placeholder:font-sans placeholder:tracking-normal placeholder:text-gray-400 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
            maxLength={8}
            onKeyDown={e => e.key === "Enter" && linkCreator()}
          />
          <button
            onClick={linkCreator}
            disabled={isLinking || !inviteCode.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors disabled:opacity-40 shrink-0"
          >
            {isLinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Link2 className="w-4 h-4" /> Add</>}
          </button>
        </div>
      </div>

      {/* Creator cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-7 h-7 text-indigo-500 animate-spin" />
        </div>
      ) : linkedCreators.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Link2 className="w-7 h-7 text-gray-400" />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">No creators linked yet</h3>
          <p className="text-gray-500 text-sm">Enter an invite code above to link to a creator.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {linkedCreators.map(creator => {
            const creatorVideos = allVideos.filter(v => v.creatorId === creator.id);
            const pending = creatorVideos.filter(v => v.status === "pending").length;
            const uploaded = creatorVideos.filter(v => v.status === "uploaded").length;

            return (
              <motion.div
                key={creator.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-[0px_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
                onClick={() => setSelectedCreator(creator)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-base group-hover:bg-indigo-700 transition-colors">
                      {creator.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{creator.name}</p>
                      <p className="text-xs text-gray-500">{creator.email}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <VideoIcon className="w-3.5 h-3.5" /> {creatorVideos.length} videos
                  </span>
                  {pending > 0 && (
                    <span className="flex items-center gap-1 text-amber-600">
                      <Clock className="w-3.5 h-3.5" /> {pending} pending
                    </span>
                  )}
                  {uploaded > 0 && (
                    <span className="flex items-center gap-1 text-blue-600">
                      <Upload className="w-3.5 h-3.5" /> {uploaded} live
                    </span>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-indigo-600 font-semibold group-hover:underline">View videos →</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
