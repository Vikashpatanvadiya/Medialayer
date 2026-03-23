import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Video, 
  Users, 
  Settings, 
  LogOut, 
  Bell, 
  CheckCircle2, 
  Clock,
  XCircle,
  Menu,
  X
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useListNotifications, useMarkNotificationRead } from "@workspace/api-client-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: notifData, refetch: refetchNotifs } = useListNotifications({
    query: { refetchInterval: 30000, enabled: !!user } // poll every 30s
  });
  
  const markReadMutation = useMarkNotificationRead({
    mutation: {
      onSuccess: () => refetchNotifs()
    }
  });

  if (!user) return null;

  const isCreator = user.role === 'creator';
  const notifications = notifData?.notifications || [];
  const unreadCount = notifications.filter(n => !n.read).length;

  const navLinks = isCreator ? [
    { name: "Dashboard", href: "/dashboard/creator", icon: LayoutDashboard },
    { name: "All Videos", href: "/dashboard/creator/videos", icon: Video },
    { name: "My Editors", href: "/dashboard/creator/editors", icon: Users },
  ] : [
    { name: "Dashboard", href: "/dashboard/editor", icon: LayoutDashboard },
    { name: "My Submissions", href: "/dashboard/editor/submissions", icon: Video },
  ];

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-sidebar border-r border-sidebar-border h-full relative z-20">
        <div className="p-6 flex items-center gap-3">
          <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Layer Logo" className="w-8 h-8 rounded-lg" />
          <span className="text-xl font-display font-bold text-sidebar-foreground tracking-tight">Layer</span>
        </div>

        <div className="px-4 py-2">
          <p className="text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider mb-4 px-2">Menu</p>
          <nav className="space-y-1">
            {navLinks.map((link) => {
              const isActive = location === link.href || (link.href.length > 1 && location.startsWith(link.href) && link.href !== "/dashboard/creator" && link.href !== "/dashboard/editor") || location === link.href;
              return (
                <Link key={link.name} href={link.href}>
                  <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'}`}>
                    <link.icon className="w-5 h-5" />
                    <span>{link.name}</span>
                    {isActive && (
                      <motion.div layoutId="sidebar-active" className="absolute left-0 w-1 h-8 bg-primary rounded-r-full" />
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-[#7c3aed] flex items-center justify-center text-white font-bold font-display shadow-lg shadow-primary/20">
              {user.name?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
              <p className="text-xs text-sidebar-foreground/50 capitalize">{user.role}</p>
            </div>
          </div>
          <button 
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-8 border-b border-border/50 bg-background/80 backdrop-blur-xl z-10">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-foreground" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-semibold font-display capitalize hidden sm:block">
              {location.includes('creator') ? 'Creator Workspace' : 'Editor Workspace'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <button className="relative p-2 rounded-full hover:bg-secondary transition-colors focus:outline-none">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background" />
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0 rounded-2xl shadow-xl shadow-black/10 overflow-hidden border-border/50">
                <div className="px-4 py-3 bg-secondary/50 border-b border-border/50 flex justify-between items-center">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{unreadCount} new</span>
                </div>
                <ScrollArea className="h-[300px]">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                      <Bell className="w-8 h-8 mb-2 opacity-20" />
                      <p className="text-sm">You're all caught up!</p>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {notifications.map((notif) => (
                        <div 
                          key={notif.id} 
                          onClick={() => !notif.read && markReadMutation.mutate({ id: notif.id })}
                          className={`p-4 border-b border-border/50 last:border-0 hover:bg-secondary/50 cursor-pointer transition-colors ${!notif.read ? 'bg-primary/5' : ''}`}
                        >
                          <div className="flex gap-3">
                            <div className="mt-1">
                              {notif.type.includes('approved') && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                              {notif.type.includes('rejected') && <XCircle className="w-5 h-5 text-destructive" />}
                              {notif.type.includes('pending') && <Clock className="w-5 h-5 text-amber-500" />}
                            </div>
                            <div>
                              <p className={`text-sm ${!notif.read ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                                {notif.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{notif.message}</p>
                              <p className="text-[10px] text-muted-foreground mt-2 font-medium">
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
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-gray-50/30 dark:bg-background">
          <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full h-full">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <motion.aside 
            initial={{ x: "-100%" }} 
            animate={{ x: 0 }} 
            exit={{ x: "-100%" }} 
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-3/4 max-w-sm bg-sidebar h-full relative z-10 flex flex-col border-r border-sidebar-border shadow-2xl"
          >
             <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Layer Logo" className="w-8 h-8 rounded-lg" />
                  <span className="text-xl font-display font-bold text-sidebar-foreground">Layer</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-sidebar-foreground/50 hover:text-sidebar-foreground">
                  <X className="w-6 h-6" />
                </button>
             </div>
             <nav className="space-y-1 px-4 mt-4">
              {navLinks.map((link) => {
                const isActive = location === link.href || (link.href.length > 1 && location.startsWith(link.href) && link.href !== "/dashboard/creator" && link.href !== "/dashboard/editor");
                return (
                  <Link key={link.name} href={link.href} onClick={() => setIsMobileMenuOpen(false)}>
                    <div className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-sidebar-foreground/70'}`}>
                      <link.icon className="w-5 h-5" />
                      <span>{link.name}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </motion.aside>
        </div>
      )}
    </div>
  );
}
