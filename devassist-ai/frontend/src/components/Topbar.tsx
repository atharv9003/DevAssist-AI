"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  Command,
  Menu,
  Sparkles,
  GitPullRequest,
  CheckCircle2,
  ExternalLink,
  Plus,
  Bell,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useDashboardStore } from "@/lib/stores/dashboardStore";

interface TopbarProps {
  onOpenPalette: () => void;
  onToggleMobileMenu: () => void;
}

const routeTitleMap: Record<string, string> = {
  "/dashboard": "Engineering Dashboard",
  "/search": "Codebase Semantic Search (RAG)",
  "/reviews": "Pull Request Reviews",
  "/repositories": "Connected Repositories",
  "/analytics": "Engineering Analytics",
  "/integrations": "Model Context Protocol (MCP)",
  "/settings": "System & Pipeline Settings",
};

export function Topbar({ onOpenPalette, onToggleMobileMenu }: TopbarProps) {
  const pathname = usePathname();
  const { statusData, analytics } = useDashboardStore();

  const getPageTitle = () => {
    if (pathname.startsWith("/reviews/") && pathname !== "/reviews") {
      return "Review Inspection";
    }
    return routeTitleMap[pathname] || "DevAssist AI";
  };

  const activeReviews = analytics?.reviews.running ?? 0;

  return (
    <header className="h-14 border-b border-border bg-card/75 backdrop-blur-md sticky top-0 z-30 px-4 flex items-center justify-between gap-3 select-none">
      {/* Left: Mobile Menu Toggle + Current Section Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-mono text-muted-foreground hidden sm:inline">
            workspace
          </span>
          <span className="text-muted-foreground/40 hidden sm:inline">/</span>
          <span className="text-xs font-semibold text-foreground truncate">
            {getPageTitle()}
          </span>
          {activeReviews > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping" />
              {activeReviews} Scanning
            </span>
          )}
        </div>
      </div>

      {/* Right: Quick Find Button + Model Status + Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Quick Find Palette Trigger */}
        <button
          type="button"
          onClick={onOpenPalette}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-border bg-muted/40 hover:bg-muted text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title="Search or jump to page (⌘K)"
        >
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="hidden md:inline text-xs">Search...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded bg-background border border-border px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </button>

        {/* Model Status Pill */}
        <div className="hidden xl:flex items-center gap-1.5 px-2 py-1 rounded-md border border-border bg-muted/30 text-[11px] font-mono text-muted-foreground">
          <Sparkles className="h-3 w-3 text-primary shrink-0" />
          <span className="text-foreground/90 font-medium">
            {statusData?.llm_model || "gemini-2.5-flash"}
          </span>
        </div>

        {/* Quick Action: New Review */}
        <Link href="/repositories">
          <button className="hidden sm:flex items-center gap-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer shadow-xs">
            <Plus className="h-3.5 w-3.5" />
            <span>New Review</span>
          </button>
        </Link>

        {/* Theme Toggle */}
        <ThemeToggle />
      </div>
    </header>
  );
}
