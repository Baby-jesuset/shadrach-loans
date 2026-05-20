import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  UserSquare2,
  Banknote,
  Receipt,
  BarChart3,
  Bell,
  Settings,
  Plane,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const nav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Applicants", url: "/members", icon: UserSquare2 },
  { title: "Loans", url: "/loans", icon: Banknote },
  { title: "Repayments", url: "/repayments", icon: Receipt },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Settings", url: "/settings", icon: Settings },
] as const;

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (url: string) => (url === "/" ? pathname === "/" : pathname.startsWith(url));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border/60">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gold text-gold-foreground shadow-sm">
            <Plane className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="font-display text-base font-semibold text-sidebar-foreground">Pearl Bridge</div>
              <div className="text-[11px] uppercase tracking-wider text-sidebar-foreground/60">Migration Loans</div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/60">
        {!collapsed && (
          <div className="px-2 py-1.5 text-[11px] text-sidebar-foreground/60">
            v2.0 · Manager workspace
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
