import { useEffect, useMemo, useState } from "react";
import {
  Instagram,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Clapperboard,
  LayoutGrid,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  useConnectInstagram,
  useDisconnectInstagram,
  useInstagramAccounts,
  useInstagramPosts,
  usePublishToInstagram,
  type InstagramPost,
  type InstagramPostType,
} from "@/hooks/use-instagram";

const MAX_CAPTION = 2200;

interface Props {
  videoId: string;
  videoStatus: string;
  videoTitle: string;
  videoTags?: string[] | null;
  thumbnailUrl?: string | null;
  /** Photo submissions can only be feed posts — Instagram has no image Reels. */
  isPhoto?: boolean;
  /** What the editor picked at submission time. */
  defaultPostType?: InstagramPostType;
  isCreator: boolean;
}

function statusLine(post: InstagramPost) {
  switch (post.status) {
    case "PENDING":
      return {
        icon: <Loader2 className="w-4 h-4 animate-spin" />,
        text: "Publishing…",
        className: "text-muted-foreground",
      };
    case "PUBLISHED":
      return {
        icon: <CheckCircle2 className="w-4 h-4" />,
        text: post.postType === "REELS" ? "Published as Reel" : "Published to feed",
        className: "text-[var(--green-4)]",
      };
    default:
      return {
        icon: <AlertCircle className="w-4 h-4" />,
        text: "Failed",
        className: "text-[var(--red-4)]",
      };
  }
}

/** Publish history — the only Instagram UI an editor sees. */
function PublishHistory({ posts }: { posts: InstagramPost[] }) {
  if (posts.length === 0) return null;
  return (
    <ul className="space-y-2">
      {posts.map((post) => {
        const line = statusLine(post);
        return (
          <li
            key={post.id}
            className="rounded-[var(--radius-4)] border border-border bg-muted/30 px-3 py-2.5 space-y-1"
          >
            <div className={`flex items-center gap-2 text-sm font-semibold ${line.className}`}>
              {line.icon}
              <span>{line.text}</span>
              <span className="ml-auto text-xs font-normal text-muted-foreground">
                @{post.account.username}
              </span>
            </div>

            {post.status === "FAILED" && post.errorMessage && (
              <p className="text-xs leading-relaxed text-[var(--red-4)]">{post.errorMessage}</p>
            )}

            {post.status === "PUBLISHED" && post.permalink && (
              <a
                href={post.permalink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" /> View on Instagram
              </a>
            )}

            <p className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(post.publishedAt ?? post.createdAt), {
                addSuffix: true,
              })}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

export function InstagramPublishCard({
  videoId,
  videoStatus,
  videoTitle,
  videoTags,
  thumbnailUrl,
  isPhoto = false,
  defaultPostType = "REELS",
  isCreator,
}: Props) {
  const { toast } = useToast();
  const isApproved = videoStatus === "approved" || videoStatus === "uploaded";

  const { data: accountData, isLoading: accountsLoading } = useInstagramAccounts(isCreator);
  const { data: postData } = useInstagramPosts(videoId, true);
  const { connect, isConnecting } = useConnectInstagram();
  const disconnect = useDisconnectInstagram();
  const publish = usePublishToInstagram(videoId);

  const accounts = accountData?.accounts ?? [];
  const configured = accountData?.configured ?? true;
  const posts = useMemo(() => postData?.posts ?? [], [postData]);

  const [accountId, setAccountId] = useState<string>("");
  const [postType, setPostType] = useState<InstagramPostType>(isPhoto ? "FEED" : defaultPostType);
  const [caption, setCaption] = useState(videoTitle);
  const [coverUrl, setCoverUrl] = useState(thumbnailUrl ?? "");

  useEffect(() => {
    if (!accountId && accounts.length > 0) setAccountId(accounts[0].id);
  }, [accounts, accountId]);

  // Toast only for publishes that finish while this page is open — never for
  // history that was already settled when the page loaded.
  const [seen, setSeen] = useState<Record<string, string>>({});
  useEffect(() => {
    for (const post of posts) {
      const previous = seen[post.id];
      if (previous === "PENDING" && post.status !== "PENDING") {
        toast(
          post.status === "PUBLISHED"
            ? { title: "Published to Instagram", description: `Live on @${post.account.username}.` }
            : {
                title: "Instagram publish failed",
                description: post.errorMessage ?? "Please try again.",
                variant: "destructive",
              },
        );
      }
      if (previous !== post.status) setSeen((prev) => ({ ...prev, [post.id]: post.status }));
    }
  }, [posts, seen, toast]);

  const isPublishing = posts.some((p) => p.status === "PENDING") || publish.isPending;

  const appendHashtags = () => {
    const tags = (videoTags ?? []).map((t) => `#${t.replace(/[^a-z0-9]/gi, "")}`).filter((t) => t.length > 1);
    if (tags.length === 0) return;
    setCaption((current) => `${current.trimEnd()}\n\n${tags.join(" ")}`.slice(0, MAX_CAPTION));
  };

  const handlePublish = async () => {
    try {
      await publish.mutateAsync({
        instagramAccountId: accountId,
        postType,
        caption,
        coverUrl: !isPhoto && postType === "REELS" && coverUrl.trim() ? coverUrl.trim() : null,
      });
      toast({
        title: "Publishing to Instagram…",
        description: "Instagram is processing the video. This usually takes a minute.",
      });
    } catch (err: any) {
      toast({
        title: "Publish failed",
        description: err?.message ?? "Please try again.",
        variant: "destructive",
      });
    }
  };

  // Editors get read-only visibility; they can never connect or publish.
  if (!isCreator) {
    if (posts.length === 0) return null;
    return (
      <div className="bg-card border border-border rounded-[var(--radius-4)] p-5 shadow-[var(--shadow-2)] space-y-4">
        <h3 className="text-[15px] font-bold text-foreground flex items-center gap-2 pb-3 border-b border-border">
          <Instagram className="w-4 h-4 text-primary" /> Instagram
        </h3>
        <PublishHistory posts={posts} />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-[var(--radius-4)] p-5 shadow-[var(--shadow-2)] space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <h3 className="text-[15px] font-bold text-foreground flex items-center gap-2">
          <Instagram className="w-4 h-4 text-primary" /> Instagram
        </h3>
        {accounts.length > 0 && (
          <button
            onClick={() => {
              disconnect.mutate(accountId, {
                onSuccess: () => toast({ title: "Instagram disconnected" }),
                onError: () =>
                  toast({ title: "Could not disconnect", variant: "destructive" }),
              });
            }}
            disabled={disconnect.isPending}
            className="text-xs text-muted-foreground hover:text-[var(--red-4)] transition-colors disabled:opacity-60"
          >
            {disconnect.isPending ? "Disconnecting…" : "Disconnect"}
          </button>
        )}
      </div>

      <PublishHistory posts={posts} />

      {!isApproved ? (
        <p
          className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-[var(--radius-4)] px-3 py-2"
          title="Video must be approved before publishing."
        >
          <AlertCircle className="w-3.5 h-3.5 mt-px shrink-0" />
          {isPhoto ? "Photo" : "Video"} must be approved before publishing to Instagram.
        </p>
      ) : !configured ? (
        <p className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-[var(--radius-4)] px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 mt-px shrink-0" />
          Instagram publishing isn't configured on this server yet.
        </p>
      ) : accountsLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Checking connection…
        </div>
      ) : accounts.length === 0 ? (
        <>
          <p className="text-sm text-muted-foreground">
            Connect your Instagram Professional account to publish this{" "}
            {isPhoto ? "photo to your feed" : "video as a Reel or feed post"}. You'll sign in on
            Instagram — no Facebook Page needed.
          </p>
          <button
            onClick={async () => {
              const result = await connect();
              if (!result.ok) {
                toast({
                  title: "Could not start Instagram login",
                  description: result.detail,
                  variant: "destructive",
                });
              }
            }}
            disabled={isConnecting}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-[var(--radius-4)] border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-60"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Connecting…
              </>
            ) : (
              <>
                <Instagram className="w-4 h-4" /> Connect Instagram
              </>
            )}
          </button>
        </>
      ) : (
        <>
          {accounts.length > 1 && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="ig-account">
                Account
              </label>
              <select
                id="ig-account"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 rounded-[var(--radius-4)] border border-border bg-card text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring/20"
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    @{account.username}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isPhoto ? (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <LayoutGrid className="w-3.5 h-3.5" />
              Photos are published as feed posts.
            </p>
          ) : (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Post type</p>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { value: "REELS", label: "Reel", icon: Clapperboard },
                  { value: "FEED", label: "Feed post", icon: LayoutGrid },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  onClick={() => setPostType(option.value)}
                  className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-[var(--radius-4)] text-xs font-semibold border transition-colors ${
                    postType === option.value
                      ? "bg-primary text-white border-primary"
                      : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-primary"
                  }`}
                >
                  <option.icon className="w-3.5 h-3.5" />
                  {option.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {postType === "REELS"
                ? "Posted to Reels only."
                : "Posted to Reels and shown on your profile feed."}
            </p>
          </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="ig-caption">
                Caption
              </label>
              <span
                className={`text-[10px] ${
                  caption.length > MAX_CAPTION ? "text-[var(--red-4)]" : "text-muted-foreground"
                }`}
              >
                {caption.length}/{MAX_CAPTION}
              </span>
            </div>
            <textarea
              id="ig-caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={4}
              placeholder="Write a caption and hashtags…"
              className="w-full px-3 py-2 rounded-[var(--radius-4)] border border-border bg-card text-sm resize-y focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring/20"
            />
            {(videoTags?.length ?? 0) > 0 && (
              <button
                type="button"
                onClick={appendHashtags}
                className="text-xs text-primary hover:underline"
              >
                + Add video tags as hashtags
              </button>
            )}
          </div>

          {!isPhoto && postType === "REELS" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="ig-cover">
                Cover image URL (optional)
              </label>
              <input
                id="ig-cover"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://…/cover.jpg"
                className="w-full px-3 py-2 rounded-[var(--radius-4)] border border-border bg-card text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring/20"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to let Instagram pick a frame.
              </p>
            </div>
          )}

          <button
            onClick={handlePublish}
            disabled={isPublishing || !accountId || caption.length > MAX_CAPTION}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-[var(--radius-4)] bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-colors shadow-[var(--shadow-1)] disabled:opacity-60"
          >
            {isPublishing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Publishing…
              </>
            ) : (
              <>
                <Instagram className="w-4 h-4" /> Publish to Instagram
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}
