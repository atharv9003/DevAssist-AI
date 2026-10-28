"use client";

import { useDashboardStore } from "@/lib/stores/dashboardStore";
import { AlertTriangle, X, RefreshCw } from "lucide-react";

export function ConnectionErrorBanner() {
  const { connectionError, clearConnectionError, fetchStatus } = useDashboardStore();

  if (!connectionError) return null;

  return (
    <div className="mx-4 sm:mx-6 mt-3 flex items-center gap-3 rounded-lg border border-amber-500/25 bg-amber-500/10 px-4 py-2.5 backdrop-blur-xs text-xs animate-in slide-in-from-top-2 duration-150">
      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-amber-600 dark:text-amber-400">Backend connection error</p>
        <p className="text-[11px] text-amber-700/80 dark:text-amber-300/70 font-mono mt-0.5 truncate">
          {connectionError}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={fetchStatus}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/15 border border-amber-500/30 text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 transition-colors cursor-pointer"
        >
          <RefreshCw className="h-3 w-3" />
          <span>Retry</span>
        </button>
        <button
          onClick={clearConnectionError}
          className="p-1 rounded text-amber-600/70 dark:text-amber-400/70 hover:text-amber-600 dark:hover:text-amber-300 transition-colors cursor-pointer"
          aria-label="Dismiss connection error"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
