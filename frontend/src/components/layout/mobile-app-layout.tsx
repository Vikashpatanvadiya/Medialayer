import { ReactNode, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Home,
  Video,
  Users,
  Bell,
  User as UserIcon,
  ChevronLeft,
  LogOut,
  Settings,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Tab {
  label: string;
  href: string;
  icon: typeof Home;
  badge?: number;
}

/** Titles for the compact app bar, longest paths first. */
const TITLES: [string, string][] = [
  ["/dashboard/creator/videos", "All videos"],
  ["/dashboard/creator/editors", "My editors"],
  ["/dashboard/editor/submissions", "My submissions"],
  ["/dashboard/editor/creators", "My creators"],
  ["/dashboard/notifications", "Notifications"],
  ["/dashboard/profile", "Settings"],
  ["/dashboard/creator", "Home"],
  ["/dashboard/editor", "Home"],
];

function titleFor(location: string): string {
  if (location === "/") return "Home";
  if (/\/video\/[^/]+$/.test(location)) return "Video";
  const match = TITLES.find(([path]) => location === path || location.startsWith(`${path}/`));
  return match?.[1] ?? "MediaLayer";
}

/**
 * Phone shell: compact app bar on top, thumb-reachable tab bar at the bottom,
 * and a single scrolling content area between them — no sidebar, no web chrome.
 */
export function MobileAppLayout({
  children,
  unreadCount,
}: {
  children: ReactNode;
  unreadCount: number;
}) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const isCreator = user?.role === "creator";
  const home = isCreator ? "/dashboard/creator" : "/dashboard/editor";

  const tabs: Tab[] = isCreator
    ? [
        { label: "Home", href: "/dashboard/creator", icon: Home },
        { label: "Videos", href: "/dashboard/creator/videos", icon: Video },
        { label: "Editors", href: "/dashboard/creator/editors", icon: Users },
        { label: "Alerts", href: "/dashboard/notifications", icon: Bell, badge: unreadCount },
        { label: "You", href: "/dashboard/profile", icon: UserIcon },
      ]
    : [
        { label: "Home", href: "/dashboard/editor", icon: Home },
        { label: "Submissions", href: "/dashboard/editor/submissions", icon: Video },
        { label: "Creators", href: "/dashboard/editor/creators", icon: Users },
        { label: "Alerts", href: "/dashboard/notifications", icon: Bell, badge: unreadCount },
        { label: "You", href: "/dashboard/profile", icon: UserIcon },
      ];

  // "/" renders the role dashboard, so it lights up the Home tab too.
  const isTabActive = (href: string) =>
    href === home
      ? location === href || location === "/"
      : location === href || location.startsWith(`${href}/`);

  // Detail views get a back affordance instead of the workspace identity.
  const isDetail = /\/video\/[^/]+$/.test(location);
  const title = titleFor(location);

  // Fixed overlays (install card, update banner) must clear the tab bar.
  useEffect(() => {
    document.documentElement.dataset.tabbar = "true";
    return () => {
      delete document.documentElement.dataset.tabbar;
    };
  }, []);

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-background">
      {/* App bar */}
      <header className="z-20 flex shrink-0 items-center gap-2 border-b border-border bg-background/95 px-3 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="flex h-12 w-full items-center gap-2">
          {isDetail ? (
            <>
              <button
                type="button"
                onClick={() => window.history.back()}
                aria-label="Back"
                className="-ml-1 flex size-9 items-center justify-center rounded-full active:bg-muted"
              >
                <ChevronLeft className="size-5" />
              </button>
              <h1 className="truncate text-[17px] font-semibold tracking-tight">{title}</h1>
            </>
          ) : (
            // Tab screens carry their own large heading, so the bar stays quiet.
            <>
              <img src="/favicon.svg" alt="MediaLayer" className="ml-1 size-5" />
              <span className="sr-only">{title}</span>
            </>
          )}

          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Account"
                className="ml-auto flex size-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
              >
                {user?.name?.charAt(0).toUpperCase() ?? "?"}
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-56 rounded-[var(--radius-5)] p-1.5 shadow-[var(--shadow-3)]"
            >
              <div className="border-b border-border px-3 py-2">
                <p className="truncate text-sm font-semibold text-foreground">{user?.name}</p>
                <p className="truncate text-xs capitalize text-muted-foreground">{user?.role}</p>
              </div>
              <Link href="/dashboard/profile">
                <div className="mt-1 flex items-center gap-2 rounded-[var(--radius-4)] px-3 py-2.5 text-sm text-muted-foreground active:bg-muted">
                  <Settings className="size-4" />
                  Settings
                </div>
              </Link>
              <button
                type="button"
                onClick={() => logout()}
                className="flex w-full items-center gap-2 rounded-[var(--radius-4)] px-3 py-2.5 text-sm text-muted-foreground active:bg-destructive/10 active:text-destructive"
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            </PopoverContent>
          </Popover>
        </div>
      </header>

      {/* Scrolling content */}
      <main className="flex-1 overflow-y-auto overscroll-contain px-4 pb-8 pt-5">
        {children}
      </main>

      {/* Tab bar */}
      <nav
        aria-label="Primary"
        className="z-20 shrink-0 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
      >
        <ul className="flex items-stretch">
          {tabs.map((tab) => {
            const active = isTabActive(tab.href);
            return (
              <li key={tab.href} className="flex-1">
                <Link
                  href={tab.href}
                  className="flex flex-col items-center gap-1 py-2 pt-2.5 active:opacity-60"
                  aria-current={active ? "page" : undefined}
                >
                  <span className="relative">
                    <tab.icon
                      className={`size-[22px] transition-colors ${
                        active ? "text-primary" : "text-muted-foreground"
                      }`}
                      strokeWidth={active ? 2.2 : 1.8}
                    />
                    {Boolean(tab.badge) && (
                      <span className="absolute -right-1.5 -top-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-4 text-destructive-foreground">
                        {tab.badge! > 9 ? "9+" : tab.badge}
                      </span>
                    )}
                  </span>
                  <span
                    className={`text-[10px] font-medium tracking-tight transition-colors ${
                      active ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {tab.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
