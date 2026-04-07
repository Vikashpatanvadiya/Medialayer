import * as React from "react";
import { Link } from "wouter";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function TeamSwitcher({
  name,
  role,
  logo,
}: {
  name: string;
  role: string;
  logo?: React.ReactNode;
}) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" asChild>
          <Link href="/">
            <div
              className="flex aspect-square size-8 items-center justify-center rounded-[var(--radius-4)] text-sm font-bold"
              style={{
                background: "var(--purple-1)",
                color: "var(--purple-4)",
              }}
            >
              {logo ?? name?.charAt(0).toUpperCase()}
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{name}</span>
              <span className="truncate text-xs text-muted-foreground capitalize">{role} workspace</span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
