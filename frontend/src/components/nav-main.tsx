import { Link, useLocation } from "wouter";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    href: string;
    icon?: React.ReactNode;
    badge?: number;
  }[];
}) {
  const [location] = useLocation();

  const isActive = (href: string) =>
    location === href ||
    (href.length > 1 &&
      location.startsWith(href) &&
      href !== "/dashboard/creator" &&
      href !== "/dashboard/editor");

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Menu</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              asChild
              isActive={isActive(item.href)}
              tooltip={item.title}
            >
              <Link href={item.href}>
                {item.icon}
                <span>{item.title}</span>
                {item.badge && item.badge > 0 ? (
                  <span
                    className="ml-auto flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                    style={{ background: "var(--red-4)" }}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
