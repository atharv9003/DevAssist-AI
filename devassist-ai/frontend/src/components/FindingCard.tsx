"use client";

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Lightbulb,
  Copy,
  Check,
  Wrench,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  FileCode2,
  Tag,
  Cpu,
} from "lucide-react";

interface Finding {
  id: number;
  review_id?: number;
  file_path: string;
  line_start: number;
  severity: string;
  category: string;
  message: string;
  code_fix?: string | null;
  tool_source: string;
  is_suppressed: boolean;
}

function getSeverityDetails(severity: string) {
  switch (severity?.toLowerCase()) {
    case "critical":
    case "error":
      return {
        badge: "bg-rose-500/10 border-rose-500/25 text-rose-500 dark:text-rose-400",
        borderLeft: "border-l-rose-500",
        icon: <ShieldAlert className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400 shrink-0" />,
        label: "CRITICAL",
      };
    case "high":
      return {
        badge: "bg-orange-500/10 border-orange-500/25 text-orange-500 dark:text-orange-400",
        borderLeft: "border-l-orange-500",
        icon: <AlertCircle className="h-3.5 w-3.5 text-orange-500 dark:text-orange-400 shrink-0" />,
        label: "HIGH",
      };
    case "warning":
    case "medium":
      return {
        badge: "bg-amber-500/10 border-amber-500/25 text-amber-500 dark:text-amber-400",
        borderLeft: "border-l-amber-500",
        icon: <AlertCircle className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400 shrink-0" />,
        label: "MEDIUM",
      };
    default:
      return {
        badge: "bg-cyan-500/10 border-cyan-500/25 text-cyan-500 dark:text-cyan-400",
        borderLeft: "border-l-cyan-500",
        icon: <Lightbulb className="h-3.5 w-3.5 text-cyan-500 dark:text-cyan-400 shrink-0" />,
        label: "LOW",
      };
  }
}

export function FindingCard({
  finding,
  reviewId,
}: {
  finding: Finding;
  reviewId?: number;
}) {
  const { badge, borderLeft, icon, label } = getSeverityDetails(finding.severity);
  const [expanded, setExpanded] = useState(true);
  const [showFix, setShowFix] = useState(Boolean(finding.code_fix));
  const [copied, setCopied] = useState(false);

  function handleCopyFix() {
    if (finding.code_fix) {
      navigator.clipboard.writeText(finding.code_fix);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <article
      className={`dev-card border-l-4 ${borderLeft} overflow-hidden transition-all duration-150`}
      aria-labelledby={`finding-title-${finding.id}`}
    >
      {/* Finding Summary Bar */}
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-muted/30 border-b border-border">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider border ${badge}`}>
            {icon}
            {label}
          </span>

          <div className="flex items-center gap-1.5 min-w-0">
            <FileCode2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span
              id={`finding-title-${finding.id}`}
              className="text-xs font-mono text-foreground font-medium truncate"
            >
              {finding.file_path}
            </span>
            {finding.line_start > 0 && (
              <span className="text-[11px] font-mono text-primary font-medium shrink-0">
                :L{finding.line_start}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 text-[11px] font-mono text-muted-foreground">
          <span className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded border border-border">
            <Tag className="h-2.5 w-2.5" />
            {finding.category || "Security"}
          </span>
          <span className="hidden sm:inline-flex items-center gap-1">
            <Cpu className="h-2.5 w-2.5" />
            {finding.tool_source || "llm_ensemble"}
          </span>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors cursor-pointer"
            aria-label={expanded ? "Collapse finding details" : "Expand finding details"}
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </header>

      {/* Expandable Finding Body */}
      {expanded && (
        <div className="p-4 space-y-3.5 text-xs">
          {/* Explanation */}
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold block">
              Issue Analysis
            </span>
            <p className="text-foreground/90 leading-relaxed font-sans">
              {finding.message}
            </p>
          </div>

          {/* Suggested Patch / Fix Section */}
          {finding.code_fix && (
            <div className="pt-2.5 border-t border-border space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-mono">
                  <Wrench className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />
                  <span>RECOMMENDED CODE FIX</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowFix(!showFix)}
                    className="text-[11px] text-muted-foreground hover:text-foreground transition-colors font-mono cursor-pointer"
                  >
                    {showFix ? "Hide Diff" : "Show Diff"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyFix}
                    className="flex items-center gap-1 rounded bg-card border border-border px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer font-mono"
                    aria-label="Copy suggested code patch to clipboard"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-500" />
                        <span className="text-emerald-500 font-medium">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy Patch</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {showFix && (
                <div className="rounded-md border border-border bg-muted/40 p-3.5 overflow-x-auto text-xs font-mono text-emerald-600 dark:text-emerald-300 leading-relaxed">
                  <pre>
                    <code>{finding.code_fix}</code>
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
