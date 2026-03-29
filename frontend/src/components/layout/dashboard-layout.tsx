import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Video,
  Users,
  Bell,
  CheckCircle2,
  Clock,
  XCircle,
  Menu,
  X,
  Search,
  ChevronDown,
  Settings,
  LogOut,
  Upload,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useListNotifications, useMarkNotificationRead } from "@workspace/api-client-react";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { InviteModal } from "@/components/ui/invite-modal";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: notifData, refetch: refetchNotifs } = useListNotifications({
    query: { refetchInterval: 30000, enabled: !!user },
  });

  const markReadMutation = useMarkNotificationRead({
    mutation: { onSuccess: () => refetchNotifs() },
  });

  if (!user) return null;

  const isCreator = user.role === "creator";
  const notifications = notifData?.notifications || [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const navLinks = isCreator
    ? [
        { name: "Dashboard", href: "/dashboard/creator", icon: LayoutDashboard },
        { name: "All Videos", href: "/dashboard/creator/videos", icon: Video },
        { name: "My Editors", href: "/dashboard/creator/editors", icon: Users },
        { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
        { name: "Settings", href: "/dashboard/profile", icon: Settings },
      ]
    : [
        { name: "Dashboard", href: "/dashboard/editor", icon: LayoutDashboard },
        { name: "My Submissions", href: "/dashboard/editor/submissions", icon: Video },
        { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
        { name: "Settings", href: "/dashboard/profile", icon: Settings },
      ];

  const isActive = (href: string) =>
    location === href ||
    (href.length > 1 &&
      location.startsWith(href) &&
      href !== "/dashboard/creator" &&
      href !== "/dashboard/editor");

  const SidebarContent = () => (
    <>
      {/* Workspace name — ref: org name + member count at top */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user.name?.charAt(0).toUpperCase() ?? "M"}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-tight">{user.name}</p>
              <p className="text-xs text-gray-400 capitalize">{user.role}</p>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
        {user.role === "creator" && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="mt-1.5 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
          >
            <Users className="w-4 h-4" />
            Invite teammates
          </button>
        )}
      </div>

      {/* Nav links — ref: icon + label, purple active bg */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {navLinks.map((link) => {
          const active = isActive(link.href);
          return (
            <Link key={link.name} href={link.href}>
              <div
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm font-medium ${
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-600 rounded-r-full" />
                )}
                <link.icon className="w-4 h-4 shrink-0" />
                <span>{link.name}</span>
                {link.name === "Notifications" && unreadCount > 0 && (
                  <span className="ml-auto w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom CTA — ref: purple "Record a video" button at bottom of sidebar */}
      <div className="px-4 py-4 border-t border-gray-100">
        {isCreator ? (
          <Link href="/dashboard/creator/videos">
            <div className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors cursor-pointer shadow-sm">
              <Upload className="w-4 h-4" />
              Upload a video
            </div>
          </Link>
        ) : (
          <Link href="/dashboard/editor/submissions">
            <div className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors cursor-pointer shadow-sm">
              <Upload className="w-4 h-4" />
              Submit a video
            </div>
          </Link>
        )}
      </div>
    </>
  );

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden">

      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-200 h-full shrink-0">
        {/* Logo */}
        <div className="px-5 py-4 flex items-center border-b border-gray-100">
          <span style={{ fontFamily: "'Syne', sans-serif" }} className="font-extrabold text-[18px] tracking-tight text-[#1a1f3c]">MediaLayer</span>
        </div>
        <SidebarContent />
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">

        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-6 bg-white border-b border-gray-200 shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-3 flex-1">
            <button className="md:hidden text-gray-500" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative hidden sm:flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg w-56 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-colors placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <Bell className="w-4 h-4 text-gray-500" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0 rounded-xl shadow-lg border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-semibold text-sm text-gray-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{unreadCount} new</span>
                  )}
                </div>
                <ScrollArea className="h-[280px]">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center flex flex-col items-center">
                      <Bell className="w-7 h-7 mb-2 text-gray-300" />
                      <p className="text-sm text-gray-400">You're all caught up!</p>
                    </div>
                  ) : (
                    <div className="flex flex-col divide-y divide-gray-100">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => !notif.read && markReadMutation.mutate({ id: notif.id })}
                          className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${!notif.read ? "bg-indigo-50/50" : ""}`}
                        >
                          <div className="flex gap-3">
                            <div className="mt-0.5 shrink-0">
                              {notif.type.includes("approved") && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                              {notif.type.includes("rejected") && <XCircle className="w-4 h-4 text-red-500" />}
                              {notif.type.includes("pending") && <Clock className="w-4 h-4 text-amber-500" />}
                            </div>
                            <div>
                              <p className={`text-sm ${!notif.read ? "font-semibold text-gray-900" : "text-gray-600"}`}>
                                {notif.title}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                              <p className="text-[10px] text-gray-400 mt-1.5">
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

            {/* Profile avatar */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                    {user.name?.charAt(0).toUpperCase() ?? "?"}
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden sm:block">{user.name?.split(" ")[0]}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-48 p-1.5 rounded-xl shadow-lg border-gray-200">
                <div className="px-3 py-2 border-b border-gray-100 mb-1">
                  <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{user.role}</p>
                </div>
                <Link href="/dashboard/profile">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">
                    <Settings className="w-4 h-4" />
                    Settings
                  </div>
                </Link>
                <button
                  onClick={() => logout()}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </PopoverContent>
            </Popover>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-auto bg-gray-50">
          <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-56 bg-white h-full relative z-10 flex flex-col border-r border-gray-200 shadow-xl"
          >
            <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <span style={{ fontFamily: "'Syne', sans-serif" }} className="font-extrabold text-[18px] tracking-tight text-[#1a1f3c]">MediaLayer</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <SidebarContent />
          </motion.aside>
        </div>
      )}

      {/* Invite modal */}
      {showInviteModal && <InviteModal onClose={() => setShowInviteModal(false)} />}
    </div>
  );
}
