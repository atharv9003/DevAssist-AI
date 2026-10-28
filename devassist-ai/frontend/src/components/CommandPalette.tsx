"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  GitBranch,
  ListTodo,
  BarChart3,
  Cable,
  Settings,
  Database,
  ExternalLink,
  Command,
  X,
  Plus,
  ArrowRight,
} from "lucide-react";

interface CommandItem {
  id: string;
  title: string;
  category: "Navigation" | "Action" | "External";
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  action: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const navigate = useCallback(
    (path: string) => {
      router.push(path);
      onClose();
    },
    [router, onClose]
  );

  const commands: CommandItem[] = [
    {
      id: "nav-dashboard",
      title: "Go to Dashboard",
      category: "Navigation",
      icon: LayoutDashboard,
      shortcut: "G D",
      action: () => navigate("/dashboard"),
    },
    {
      id: "nav-search",
      title: "Search Repository Codebase (Hybrid RAG)",
      category: "Navigation",
      icon: Database,
      shortcut: "G S",
      action: () => navigate("/search"),
    },
    {
      id: "nav-reviews",
      title: "View PR Reviews & Findings",
      category: "Navigation",
      icon: ListTodo,
      shortcut: "G R",
      action: () => navigate("/reviews"),
    },
    {
      id: "nav-repos",
      title: "Manage Repositories",
      category: "Navigation",
      icon: GitBranch,
      action: () => navigate("/repositories"),
    },
    {
      id: "nav-analytics",
      title: "View Analytics & Health Scores",
      category: "Navigation",
      icon: BarChart3,
      action: () => navigate("/analytics"),
    },
    {
      id: "nav-integrations",
      title: "Configure Integrations (GitHub & MCP)",
      category: "Navigation",
      icon: Cable,
      action: () => navigate("/integrations"),
    },
    {
      id: "nav-settings",
      title: "System & LLM Settings",
      category: "Navigation",
      icon: Settings,
      action: () => navigate("/settings"),
    },
    {
      id: "act-new-review",
      title: "Trigger New Code Review",
      category: "Action",
      icon: Plus,
      action: () => navigate("/repositories"),
    },
  ];

  const filtered = commands.filter(
    (cmd) =>
      cmd.title.toLowerCase().includes(search.toLowerCase()) ||
      cmd.category.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(
          (prev) => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1)
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-xl border border-border bg-popover shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 text-popover-foreground"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Command Menu"
      >
        {/* Search Bar Input */}
        <div className="flex items-center px-4 py-3 border-b border-border gap-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a command or jump to page..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded bg-muted border border-border px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            ESC
          </kbd>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors cursor-pointer"
            aria-label="Close command palette"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground font-mono">
              No matching commands found.
            </div>
          ) : (
            filtered.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  onClick={cmd.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground/80 hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-1.5 rounded-md border shrink-0 ${
                        isSelected
                          ? "bg-primary/20 border-primary/30 text-primary"
                          : "bg-muted border-border text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="truncate">{cmd.title}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
                      {cmd.category}
                    </span>
                    {cmd.shortcut && (
                      <kbd className="rounded bg-muted border border-border px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                        {cmd.shortcut}
                      </kbd>
                    )}
                    {isSelected && <ArrowRight className="h-3 w-3 text-primary" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 border-t border-border bg-muted/30 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
          <span>Navigate with &uarr;&darr;</span>
          <span>Press Enter to select</span>
        </div>
      </div>
    </div>
  );
}
