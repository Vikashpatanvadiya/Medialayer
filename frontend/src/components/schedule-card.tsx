import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Loader2, X } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { apiUrl } from "@/lib/api";

/** `datetime-local` wants local wall-clock text, not an ISO instant. */
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Planned publish time for a submission. Either the creator or the editor can
 * set or clear it; reminders fire on the day, nothing publishes by itself.
 */
export function ScheduleCard({
  videoId,
  scheduledAt,
  destination,
  postFormat,
}: {
  videoId: string;
  scheduledAt?: string | null;
  destination?: "youtube" | "instagram";
  postFormat?: "video" | "short" | "reel" | "post";
}) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(() => toLocalInput(scheduledAt));
  const [isSaving, setIsSaving] = useState(false);

  const label =
    destination === "instagram"
      ? postFormat === "reel"
        ? "Instagram Reel"
        : "Instagram post"
      : postFormat === "short"
        ? "YouTube Short"
        : "YouTube video";

  const save = async (next: string | null) => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("layer_token");
      const res = await fetch(apiUrl(`/api/schedule/${videoId}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          scheduledAt: next ? new Date(next).toISOString() : null,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Could not update the schedule");

      queryClient.invalidateQueries({ queryKey: [`/api/videos/${videoId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/schedule"] });
      toast(
        next
          ? {
              title: "Scheduled",
              description: `${label} planned for ${format(new Date(next), "EEE d MMM 'at' h:mm a")}.`,
            }
          : { title: "Schedule cleared" },
      );
    } catch (err: any) {
      toast({
        title: "Schedule not saved",
        description: err?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-[var(--radius-4)] p-5 shadow-[var(--shadow-2)] space-y-3">
      <h3 className="text-[15px] font-bold text-foreground flex items-center gap-2 pb-3 border-b border-border">
        <CalendarDays className="w-4 h-4 text-primary" /> Schedule
      </h3>

      {scheduledAt && (
        <p className="text-sm text-foreground">
          Planned for{" "}
          <span className="font-semibold">
            {format(new Date(scheduledAt), "EEE d MMM 'at' h:mm a")}
          </span>
        </p>
      )}

      <input
        type="datetime-local"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full px-3 py-2 rounded-[var(--radius-4)] border border-border bg-card text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring/20"
      />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => save(value || null)}
          disabled={isSaving || !value}
          className="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-4)] bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarDays className="w-4 h-4" />}
          {scheduledAt ? "Update" : "Set schedule"}
        </button>
        {scheduledAt && (
          <button
            type="button"
            onClick={() => {
              setValue("");
              save(null);
            }}
            disabled={isSaving}
            className="rounded-[var(--radius-4)] p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-60"
            aria-label="Clear schedule"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        You'll get a reminder that morning and again at the scheduled time. MediaLayer never
        publishes on its own.
      </p>
    </div>
  );
}
