import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Users, Video, CheckCircle2, Clock, Upload, UserMinus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { apiUrl } from "@/lib/api";

interface EditorStats {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  totalVideos: number;
  pendingVideos: number;
  approvedVideos: number;
  uploadedVideos: number;
  rejectedVideos: number;
  lastSubmitted: string | null;
}

export default function MyEditors() {
  const { user } = useAuth();
  const [editors, setEditors] = useState<EditorStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  const removeEditor = async (editorId: string, editorName: string) => {
    if (!confirm(`Remove ${editorName} from your workspace?`)) return;
    setRemoving(editorId);
    try {
      const res = await fetch(apiUrl(`/api/users/remove-editor/${editorId}`), {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove editor");
      setEditors((prev) => prev.filter((e) => e.id !== editorId));
      toast({ title: "Editor removed", description: `${editorName} has been removed.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setRemoving(null);
    }
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const fetchEditors = async () => {
      const token = localStorage.getItem("layer_token");
      if (!token) return;
      try {
        const res = await fetch(apiUrl("/api/users/my-editors"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
          toast({ title: "Error", description: data.error || "Failed to load editors", variant: "destructive" });
          return;
        }
        setEditors(data.editors || []);
      } catch (err: any) {
        toast({ title: "Error", description: err.message || "Failed to load editors", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchEditors();
  }, [user]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">My Editors</h1>
        <p className="text-muted-foreground mt-1">All editors who have submitted videos to you.</p>
      </div>

      {editors.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-6 shadow-inner border border-border/50">
            <Users className="w-10 h-10 text-muted-foreground opacity-50" />
          </div>
          <h3 className="text-xl font-display font-bold mb-2">No editors yet</h3>
          <p className="text-muted-foreground leading-relaxed">
            Once an editor submits a video to you, they'll appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {editors.map((editor) => (
            <div
              key={editor.id}
              className="bg-card border border-border/50 rounded-2xl p-6 space-y-5 hover:border-primary/30 transition-colors"
            >
              {/* Avatar + Name */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-[#4338ca] flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary/20 shrink-0">
                  {editor.name?.charAt(0).toUpperCase() ?? "?"}
                </div>
                <div className="overflow-hidden">
                  <p className="font-semibold text-foreground truncate">{editor.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{editor.email}</p>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary/50 rounded-xl p-3 flex items-center gap-2">
                  <Video className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-bold text-foreground">{editor.totalVideos}</p>
                  </div>
                </div>
                <div className="bg-amber-500/10 rounded-xl p-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Pending</p>
                    <p className="font-bold text-foreground">{editor.pendingVideos}</p>
                  </div>
                </div>
                <div className="bg-emerald-500/10 rounded-xl p-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Approved</p>
                    <p className="font-bold text-foreground">{editor.approvedVideos}</p>
                  </div>
                </div>
                <div className="bg-blue-500/10 rounded-xl p-3 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-blue-500 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Uploaded</p>
                    <p className="font-bold text-foreground">{editor.uploadedVideos}</p>
                  </div>
                </div>
              </div>

              {/* Last submitted */}
              {editor.lastSubmitted && (
                <p className="text-xs text-muted-foreground border-t border-border/50 pt-4">
                  Last submitted {formatDistanceToNow(new Date(editor.lastSubmitted), { addSuffix: true })}
                </p>
              )}

              <Button
                variant="outline"
                size="sm"
                disabled={removing === editor.id}
                onClick={() => removeEditor(editor.id, editor.name)}
                className="w-full rounded-xl border-destructive/30 text-destructive hover:bg-destructive hover:text-white transition-colors"
              >
                {removing === editor.id
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <><UserMinus className="w-4 h-4 mr-2" /> Remove Editor</>
                }
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
