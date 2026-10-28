"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  ListTodo,
  GitBranch,
  BarChart3,
  Cable,
  Settings,
  Shield,
  Command,
  Sparkles,
  X,
  Code2,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useDashboardStore } from "@/lib/stores/dashboardStore";

interface SidebarProps {
  onOpenPalette?: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

const primaryNav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Code Search", href: "/search", icon: Search },
  { name: "Reviews", href: "/reviews", icon: ListTodo, badgeKey: "reviews" },
  { name: "Repositories", href: "/repositories", icon: GitBranch, badgeKey: "repos" },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
];

const secondaryNav = [
  { name: "Integrations", href: "/integrations", icon: Cable },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({
  onOpenPalette,
  isOpenMobile = false,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const { reviews, repositories, statusData } = useDashboardStore();

  const getBadge = (key?: string) => {
    if (key === "reviews" && reviews.length > 0) return reviews.length;
    if (key === "repos" && repositories.length > 0) return repositories.length;
    return null;
  };

  const navContent = (
    <aside className="flex h-full w-[240px] shrink-0 flex-col bg-sidebar border-r border-sidebar-border select-none">
      {/* Brand Header */}
      <div className="flex h-14 items-center justify-between px-4 border-b border-sidebar-border">
        <Link
          href="/dashboard"
          onClick={onCloseMobile}
          className="flex items-center gap-2.5 group"
        >
          <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs shadow-xs group-hover:scale-105 transition-transform">
            D
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-[13px] text-sidebar-foreground tracking-tight">
              DevAssist
            </span>
            <span className="text-[10px] font-mono text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.2 rounded font-medium">
              AI v3.0
            </span>
          </div>
        </Link>

        {isOpenMobile && onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Command Palette Trigger */}
      <div className="px-3 pt-3 pb-1">
        <button
          type="button"
          onClick={() => {
            onOpenPalette?.();
            onCloseMobile?.();
          }}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md border border-sidebar-border bg-sidebar-accent/50 text-xs text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground/70" />
            <span className="text-xs">Quick find...</span>
          </div>
          <kbd className="flex items-center gap-0.5 rounded bg-background border border-sidebar-border px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </button>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        <div>
          <p className="px-2 pb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70 font-mono">
            Platform
          </p>
          <nav className="space-y-0.5">
            {primaryNav.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
              const Icon = item.icon;
              const badge = getBadge(item.badgeKey);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary font-semibold border-l-2 border-primary"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        isActive ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                    <span className="truncate">{item.name}</span>
                  </div>
                  {badge !== null && (
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-sidebar-accent text-muted-foreground border border-sidebar-border">
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <p className="px-2 pb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70 font-mono">
            Configuration
          </p>
          <nav className="space-y-0.5">
            {secondaryNav.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary font-semibold border-l-2 border-primary"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        isActive ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Connected Project / Model Status */}
      <div className="px-3 pb-3">
        <div className="p-2.5 rounded-md border border-sidebar-border bg-sidebar-accent/30">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="text-muted-foreground font-mono">ENGINE</span>
            <span className="inline-flex items-center gap-1 text-emerald-500 dark:text-emerald-400 font-medium font-mono text-[10px]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              ONLINE
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-sidebar-foreground truncate font-mono">
            <Sparkles className="h-3 w-3 text-primary shrink-0" />
            <span className="truncate">{statusData?.llm_model || "gemini-2.5-flash"}</span>
          </div>
        </div>
      </div>

      {/* User Footer */}
      <div className="border-t border-sidebar-border p-3 bg-sidebar-accent/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-7 w-7 rounded bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
              <Shield className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium text-sidebar-foreground truncate">
                Admin Console
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                Local Workspace
              </span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:flex h-full shrink-0">
        {navContent}
      </div>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex animate-in fade-in duration-200"
          onClick={onCloseMobile}
        >
          <div
            className="w-[260px] h-full shadow-2xl animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
