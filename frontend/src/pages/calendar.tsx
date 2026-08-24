import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Instagram,
  Youtube,
  CalendarDays,
  Image as ImageIcon,
  Clapperboard,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { apiUrl } from "@/lib/api";

interface ScheduledPost {
  id: string;
  title: string;
  status: "pending" | "approved" | "rejected" | "uploaded";
  mediaType: "video" | "image";
  destination: "youtube" | "instagram";
  format: "video" | "short" | "reel" | "post";
  scheduledAt: string;
  scheduleTimezone: string | null;
  thumbnailUrl: string | null;
  creatorName: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  approved: "bg-[var(--green-1)] text-[var(--green-4)] border-[var(--green-2)]",
  pending: "bg-[var(--amber-1)] text-[var(--amber-4)] border-[var(--amber-2)]",
  rejected: "bg-[var(--red-1)] text-[var(--red-4)] border-[var(--red-2)]",
  uploaded: "bg-[var(--sky-1)] text-[var(--sky-4)] border-[var(--sky-2)]",
};

function formatLabel(post: ScheduledPost): string {
  if (post.destination === "instagram") return post.format === "reel" ? "Reel" : "Post";
  return post.format === "short" ? "Short" : "Video";
}

function DestinationIcon({ post, className = "size-3.5" }: { post: ScheduledPost; className?: string }) {
  if (post.destination === "instagram") return <Instagram className={className} />;
  return <Youtube className={className} />;
}

function PostChip({ post }: { post: ScheduledPost }) {
  const time = format(new Date(post.scheduledAt), "h:mm a");
  return (
    <Link href={`/dashboard/creator/video/${post.id}`}>
      <div className="group cursor-pointer overflow-hidden rounded-[var(--radius-4)] border border-border bg-card shadow-[var(--shadow-1)] transition-shadow hover:shadow-[var(--shadow-2)]">
        {post.thumbnailUrl ? (
          <img src={post.thumbnailUrl} alt="" className="h-16 w-full object-cover" />
        ) : (
          <div className="flex h-10 w-full items-center justify-center bg-muted">
            {post.mediaType === "image" ? (
              <ImageIcon className="size-4 text-muted-foreground" />
            ) : (
              <Clapperboard className="size-4 text-muted-foreground" />
            )}
          </div>
        )}
        <div className="flex items-center gap-1.5 px-2 py-1.5">
          <span className="text-[11px] font-semibold text-foreground">{time}</span>
          <DestinationIcon post={post} className="ml-auto size-3.5 text-muted-foreground" />
        </div>
        <p className="truncate px-2 pb-1.5 text-[11px] text-muted-foreground">{post.title}</p>
      </div>
    </Link>
  );
}

export default function CalendarPage() {
  const [cursor, setCursor] = useState(() => new Date());
  const [view, setView] = useState<"month" | "list">("month");

  const windowStart = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
  const windowEnd = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });

  const { data, isLoading } = useQuery({
    queryKey: ["/api/schedule", windowStart.toISOString(), windowEnd.toISOString()],
    queryFn: async () => {
      const token = localStorage.getItem("layer_token");
      const params = new URLSearchParams({
        from: windowStart.toISOString(),
        to: windowEnd.toISOString(),
      });
      const res = await fetch(apiUrl(`/api/schedule?${params}`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Could not load the schedule");
      return (await res.json()) as { posts: ScheduledPost[] };
    },
  });

  const posts = useMemo(() => data?.posts ?? [], [data]);

  const days = useMemo(() => {
    const out: Date[] = [];
    for (let d = new Date(windowStart); d <= windowEnd; d.setDate(d.getDate() + 1)) {
      out.push(new Date(d));
    }
    return out;
  }, [windowStart, windowEnd]);

  const postsForDay = (day: Date) =>
    posts.filter((post) => isSameDay(new Date(post.scheduledAt), day));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-bold leading-tight text-foreground">Content calendar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Scheduled posts across YouTube and Instagram. Reminders only — nothing publishes on its
            own.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCursor(addMonths(cursor, -1))}
              aria-label="Previous month"
              className="rounded-[var(--radius-4)] p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="min-w-[9rem] text-center text-sm font-semibold text-foreground">
              {format(cursor, "MMMM yyyy")}
            </span>
            <button
              onClick={() => setCursor(addMonths(cursor, 1))}
              aria-label="Next month"
              className="rounded-[var(--radius-4)] p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="flex rounded-full border border-border p-0.5">
            {(["month", "list"] as const).map((option) => (
              <button
                key={option}
                onClick={() => setView(option)}
                className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition-colors ${
                  view === option ? "bg-foreground text-background" : "text-muted-foreground"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-[var(--radius-5)] border border-border bg-card p-16 text-center text-sm text-muted-foreground">
          Loading schedule…
        </div>
      ) : view === "month" ? (
        <div className="overflow-hidden rounded-[var(--radius-5)] border border-border bg-card shadow-[var(--shadow-2)]">
          <div className="grid grid-cols-7 border-b border-border">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
              <div
                key={label}
                className="px-2 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {days.map((day) => {
              const dayPosts = postsForDay(day);
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[8rem] border-b border-r border-border p-1.5 last:border-r-0 ${
                    isSameMonth(day, cursor) ? "" : "bg-muted/30"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between px-1">
                    <span
                      className={`text-xs font-semibold ${
                        isToday(day)
                          ? "flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                          : isSameMonth(day, cursor)
                            ? "text-foreground"
                            : "text-muted-foreground/60"
                      }`}
                    >
                      {format(day, "d")}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {dayPosts.slice(0, 2).map((post) => (
                      <PostChip key={post.id} post={post} />
                    ))}
                    {dayPosts.length > 2 && (
                      <p className="px-1 text-[10px] font-medium text-muted-foreground">
                        +{dayPosts.length - 2} more
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-5)] border border-border bg-card shadow-[var(--shadow-2)]">
          {posts.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-16 text-center">
              <CalendarDays className="size-7 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Nothing scheduled in {format(cursor, "MMMM")}.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {posts.map((post) => (
                <li key={post.id}>
                  <Link href={`/dashboard/creator/video/${post.id}`}>
                    <div className="flex cursor-pointer items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/40">
                      <div className="w-24 shrink-0 text-xs">
                        <p className="font-semibold text-foreground">
                          {format(new Date(post.scheduledAt), "EEE d MMM")}
                        </p>
                        <p className="text-muted-foreground">
                          {format(new Date(post.scheduledAt), "h:mm a")}
                        </p>
                      </div>

                      {post.thumbnailUrl ? (
                        <img
                          src={post.thumbnailUrl}
                          alt=""
                          className="h-10 w-16 shrink-0 rounded-[var(--radius-3)] object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-16 shrink-0 items-center justify-center rounded-[var(--radius-3)] bg-muted">
                          {post.mediaType === "image" ? (
                            <ImageIcon className="size-4 text-muted-foreground" />
                          ) : (
                            <Clapperboard className="size-4 text-muted-foreground" />
                          )}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{post.title}</p>
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <DestinationIcon post={post} className="size-3.5" />
                          {formatLabel(post)}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${
                          STATUS_STYLES[post.status] ?? "border-border bg-muted text-muted-foreground"
                        }`}
                      >
                        {post.status === "approved" ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="size-3" /> Approved
                          </span>
                        ) : post.status === "pending" ? (
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" /> Awaiting review
                          </span>
                        ) : (
                          post.status
                        )}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
