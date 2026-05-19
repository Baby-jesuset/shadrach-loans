import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, LogOut, Moon, Search, Sun, User } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth, useStore, useTheme } from "@/lib/mock-store";

const titles: Record<string, string> = {
  "/": "Dashboard",
  "/members": "Members",
  "/loans": "Loans",
  "/repayments": "Repayments",
  "/reports": "Reports & Analytics",
  "/notifications": "Notifications",
  "/settings": "Settings",
};

export function Topbar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const title =
    titles[pathname] ??
    Object.entries(titles).find(([k]) => k !== "/" && pathname.startsWith(k))?.[1] ??
    "Workspace";
  const { theme, toggle } = useTheme();
  const { notifications, manager } = useStore();
  const unread = notifications.filter((n) => !n.read).length;
  const { logout } = useAuth();
  const navigate = useNavigate();
  const initials = manager.name.split(" ").map((s) => s[0]).slice(0, 2).join("");

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/70 bg-background/80 px-3 backdrop-blur sm:px-6">
      <SidebarTrigger className="-ml-1" />
      <div className="hidden sm:block">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Manager workspace</div>
        <h1 className="-mt-0.5 font-display text-lg font-semibold leading-tight">{title}</h1>
      </div>

      <div className="ml-auto flex flex-1 items-center justify-end gap-2 sm:flex-none">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search members, loans…" className="h-9 w-72 pl-9" />
        </div>

        <Button variant="outline" size="icon" onClick={toggle} aria-label="Toggle theme">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Button asChild variant="outline" size="icon" className="relative" aria-label="Notifications">
          <Link to="/notifications">
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <Badge className="absolute -right-1.5 -top-1.5 h-5 min-w-5 justify-center rounded-full bg-gold p-0 text-[10px] text-gold-foreground">
                {unread}
              </Badge>
            )}
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full border border-border bg-card px-1.5 py-1 pr-3 text-left text-sm hover:bg-accent">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
              </Avatar>
              <span className="hidden sm:block leading-tight">
                <span className="block text-xs font-medium">{manager.name}</span>
                <span className="block text-[10px] text-muted-foreground">Manager</span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{manager.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings"><User className="mr-2 h-4 w-4" />Profile & settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => { logout(); navigate({ to: "/login" }); }}
            >
              <LogOut className="mr-2 h-4 w-4" />Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
