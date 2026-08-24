import * as React from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Video, Users, Bell, Settings, CalendarDays,
  Upload, ChevronDown, LogOut, ChevronsUpDown,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter,
  SidebarHeader, SidebarRail,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton,
  SidebarGroup,
} from "@/components/ui/sidebar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { InviteModal } from "@/components/ui/invite-modal";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: { name: string; email: string; role: string };
  unreadCount: number;
  onLogout: () => void;
}

export function AppSidebar({ user, unreadCount, onLogout, ...props }: AppSidebarProps) {
  const [location] = useLocation();
  const [showInvite, setShowInvite] = React.useState(false);
  const isCreator = user.role === "creator";

  const navLinks = isCreator ? [
    { title: "Dashboard",     href: "/dashboard/creator",         icon: LayoutDashboard },
    { title: "All Videos",    href: "/dashboard/creator/videos",  icon: Video },
    { title: "My Editors",    href: "/dashboard/creator/editors", icon: Users },
    { title: "Calendar",      href: "/dashboard/calendar",        icon: CalendarDays },
    { title: "Notifications", href: "/dashboard/notifications",   icon: Bell, badge: unreadCount },
    { title: "Settings",      href: "/dashboard/profile",         icon: Settings },
  ] : [
    { title: "Dashboard",     href: "/dashboard/editor",               icon: LayoutDashboard },
    { title: "My Submissions",href: "/dashboard/editor/submissions",   icon: Video },
    { title: "My Creators",   href: "/dashboard/editor/creators",      icon: Users },
    { title: "Calendar",      href: "/dashboard/calendar",             icon: CalendarDays },
    { title: "Notifications", href: "/dashboard/notifications",        icon: Bell, badge: unreadCount },
    { title: "Settings",      href: "/dashboard/profile",              icon: Settings },
  ];

  const isActive = (href: string) =>
    location === href ||
    (href.length > 1 && location.startsWith(href) &&
      href !== "/dashboard/creator" && href !== "/dashboard/editor");

  return (
    <>
      <Sidebar variant="inset" collapsible="icon" {...props}>

        {/* ── Header: workspace switcher ── */}
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
                    {/* Logo mark */}
                    <div className="flex aspect-square size-8 items-center justify-center rounded-[var(--radius-4)] shrink-0"
                      style={{ background: "var(--purple-1)" }}>
                      <img src="/favicon.svg" alt="MediaLayer" className="size-5 object-contain" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold text-foreground">MediaLayer</span>
                      <span className="truncate text-xs capitalize" style={{ color: "var(--fg-3)" }}>
                        {user.role} workspace
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4" style={{ color: "var(--fg-2)" }} />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align="start" className="w-56 rounded-[var(--radius-5)]">
                  <DropdownMenuLabel className="text-xs" style={{ color: "var(--fg-3)" }}>Workspace</DropdownMenuLabel>
                  <DropdownMenuItem className="gap-2">
                    <div className="flex size-6 items-center justify-center rounded-[var(--radius-3)]"
                      style={{ background: "var(--purple-1)" }}>
                      <img src="/favicon.svg" alt="MediaLayer" className="size-4" />
                    </div>
                    <span className="font-medium">{user.name}</span>
                  </DropdownMenuItem>
                  {isCreator && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setShowInvite(true)} className="gap-2">
                        <Users className="size-4" style={{ color: "var(--fg-3)" }} />
                        Invite teammates
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        {/* ── Nav links ── */}
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {navLinks.map((item) => {
                const active = isActive(item.href);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className="rounded-[var(--radius-4)]"
                    >
                      <Link href={item.href}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                        {item.badge && item.badge > 0 ? (
                          <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                            style={{ background: "var(--red-4)" }}>
                            {item.badge}
                          </span>
                        ) : null}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        {/* ── Footer: upload CTA + user ── */}
        <SidebarFooter>
          {/* Upload CTA */}
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="rounded-[var(--radius-4)] font-semibold text-white"
                style={{ background: "var(--purple-4)" }}>
                <Link href={isCreator ? "/dashboard/creator/videos" : "/dashboard/editor/submissions"}>
                  <Upload className="size-4" />
                  <span>{isCreator ? "Upload a video" : "Submit a video"}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
    </>
  );
}
