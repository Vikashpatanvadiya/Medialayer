import { ReactNode, useState } from "react";
import { Bell, CheckCircle2, Clock, XCircle, Search, ChevronDown, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useListNotifications, useMarkNotificationRead } from "@workspace/api-client-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: notifData, refetch: refetchNotifs } = useListNotifications({
    query: { refetchInterval: 30000, enabled: !!user },
  });

  const markReadMutation = useMarkNotificationRead({
    mutation: { onSuccess: () => refetchNotifs() },
  });

  if (!user) return null;

  const notifications = notifData?.notifications || [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <SidebarProvider>
      <AppSidebar
        user={{ name: user.name ?? "", email: user.email ?? "", role: user.role }}
        unreadCount={unreadCount}
        onLogout={logout}
      />

      <SidebarInset className="rounded-[var(--radius-4)]">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
          <SidebarTrigger className="-ml-1 size-4" />

          {/* Search */}
          <div className="relative hidden sm:flex items-center flex-1">
            <Search className="absolute left-3 w-3.5 h-3.5 text-muted-foreground pointer-events-none z-10" />
            <Input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-64 h-8 text-sm"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Notifications popover */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="relative p-2 rounded-[var(--radius-4)] hover:bg-muted transition-colors">
                  <Bell className="w-4 h-4 text-muted-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border-2 border-background" />
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0 rounded-[var(--radius-5)] shadow-[var(--shadow-3)] overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex justify-between items-center">
                  <h3 className="font-semibold text-sm text-foreground">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{unreadCount} new</span>
                  )}
                </div>
                <ScrollArea className="h-[280px]">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center flex flex-col items-center">
                      <Bell className="w-7 h-7 mb-2 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">You're all caught up!</p>
                    </div>
                  ) : (
                    <div className="flex flex-col divide-y divide-border">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => !notif.read && markReadMutation.mutate({ id: notif.id })}
                          className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${!notif.read ? "bg-primary/5" : ""}`}
                        >
                          <div className="flex gap-3">
                            <div className="mt-0.5 shrink-0">
                              {notif.type.includes("approved") && <CheckCircle2 className="w-4 h-4 text-[var(--green-4)]" />}
                              {notif.type.includes("rejected") && <XCircle className="w-4 h-4 text-destructive" />}
                              {notif.type.includes("pending") && <Clock className="w-4 h-4 text-[var(--amber-4)]" />}
                            </div>
                            <div>
                              <p className={`text-sm ${!notif.read ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                                {notif.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                              <p className="text-[10px] text-muted-foreground mt-1.5">
                                {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>

            {/* Profile dropdown */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-4)] hover:bg-muted transition-colors">
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                    {user.name?.charAt(0).toUpperCase() ?? "?"}
                  </div>
                  <span className="text-sm font-medium text-foreground hidden sm:block">{user.name?.split(" ")[0]}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-48 p-1.5 rounded-[var(--radius-5)] shadow-[var(--shadow-3)]">
                <div className="px-3 py-2 border-b border-border mb-1">
                  <p className="text-sm font-semibold text-foreground">{user.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                    {user.plan && user.plan !== "free" && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
                        style={{ background: "var(--purple-1)", color: "var(--purple-4)" }}>
                        {user.plan}
                      </span>
                    )}
                  </div>
                </div>
                <Link href="/dashboard/profile">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-4)] text-sm text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer">
                    <Settings className="w-4 h-4" />
                    Settings
                  </div>
                </Link>
                <button
                  onClick={() => logout()}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-[var(--radius-4)] text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </PopoverContent>
            </Popover>
          </div>
        </header>

        {/* Page content */}
        <div className="flex flex-1 flex-col gap-4 p-6 sm:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
