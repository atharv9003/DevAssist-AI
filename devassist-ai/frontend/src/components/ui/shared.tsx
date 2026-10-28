"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { ChevronRight, Copy, Check } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  accent?: "violet" | "cyan" | "emerald" | "rose" | "amber";
  isLoading?: boolean;
  subtext?: string;
}

const statusColorMap = {
  violet: {
    iconBg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    hoverBorder: "hover:border-indigo-500/30",
  },
  cyan: {
    iconBg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    hoverBorder: "hover:border-cyan-500/30",
  },
  emerald: {
    iconBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    hoverBorder: "hover:border-emerald-500/30",
  },
  rose: {
    iconBg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    hoverBorder: "hover:border-rose-500/30",
  },
  amber: {
    iconBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    hoverBorder: "hover:border-amber-500/30",
  },
};

export function MetricCard({
  label,
  value,
  icon,
  trend,
  trendUp,
  accent = "violet",
  isLoading = false,
  subtext,
}: MetricCardProps) {
  const colors = statusColorMap[accent];

  return (
    <div
      className={`dev-card p-4 transition-all duration-150 ${colors.hoverBorder} hover:shadow-md relative overflow-hidden group`}
    >
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className="text-xs font-medium text-muted-foreground tracking-wide truncate">
          {label}
        </span>
        <div className={`p-1.5 rounded-md border text-xs shrink-0 transition-transform group-hover:scale-105 ${colors.iconBg}`}>
          {icon}
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        {isLoading ? (
          <div className="h-7 w-20 bg-muted/60 rounded animate-pulse" />
        ) : (
          <span className="text-2xl font-semibold text-foreground tracking-tight font-mono">
            {value}
          </span>
        )}

        {trend && !isLoading && (
          <span
            className={`text-[11px] font-mono font-medium flex items-center gap-1 shrink-0 ${
              trendUp === undefined
                ? "text-muted-foreground"
                : trendUp
                ? "text-emerald-500 dark:text-emerald-400"
                : "text-rose-500 dark:text-rose-400"
            }`}
          >
            {trendUp !== undefined && (
              <span className="font-bold">{trendUp ? "↑" : "↓"}</span>
            )}
            {trend}
          </span>
        )}
      </div>

      {subtext && !isLoading && (
        <p className="text-[11px] text-muted-foreground mt-1 truncate font-mono">
          {subtext}
        </p>
      )}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  badge?: ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  action,
  icon: Icon,
  breadcrumbs,
  badge,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 pb-3 border-b border-border/80">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
          {breadcrumbs.map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              {idx > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />}
              {item.href ? (
                <Link
                  href={item.href}
                  className="hover:text-foreground transition-colors truncate"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-foreground/90 font-medium truncate">{item.label}</span>
              )}
            </div>
          ))}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary shrink-0 mt-0.5">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-semibold text-foreground tracking-tight">
                {title}
              </h1>
              {badge}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-3xl">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
      </div>
    </div>
  );
}

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  noPad?: boolean;
  interactive?: boolean;
}

export function GlassCard({
  children,
  className = "",
  noPad = false,
  interactive = false,
}: GlassCardProps) {
  return (
    <div
      className={`${interactive ? "dev-card-interactive" : "dev-card"} ${
        noPad ? "" : "p-5"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function LoadingSpinner({
  size = "md",
  label,
}: {
  size?: "sm" | "md" | "lg";
  label?: string;
}) {
  const sizeMap = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-8 w-8" };
  return (
    <div className="flex items-center justify-center gap-2.5 py-4">
      <div
        className={`animate-spin rounded-full border-2 border-border border-t-primary ${sizeMap[size]}`}
      />
      {label && <span className="text-xs text-muted-foreground font-mono">{label}</span>}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase() || "";
  const map: Record<string, { bg: string; text: string; border: string; dot: string; pulse?: boolean }> = {
    completed: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-500 dark:text-emerald-400",
      border: "border-emerald-500/20",
      dot: "bg-emerald-500",
    },
    active: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-500 dark:text-emerald-400",
      border: "border-emerald-500/20",
      dot: "bg-emerald-500",
    },
    running: {
      bg: "bg-indigo-500/10",
      text: "text-indigo-500 dark:text-indigo-400",
      border: "border-indigo-500/20",
      dot: "bg-indigo-500",
      pulse: true,
    },
    failed: {
      bg: "bg-rose-500/10",
      text: "text-rose-500 dark:text-rose-400",
      border: "border-rose-500/20",
      dot: "bg-rose-500",
    },
    pending: {
      bg: "bg-amber-500/10",
      text: "text-amber-500 dark:text-amber-400",
      border: "border-amber-500/20",
      dot: "bg-amber-500",
    },
  };

  const current = map[s] || {
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-border",
    dot: "bg-muted-foreground",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border font-mono ${current.bg} ${current.text} ${current.border}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${current.dot} ${
          current.pulse ? "animate-pulse ring-2 ring-indigo-500/30" : ""
        }`}
      />
      {status}
    </span>
  );
}

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="dev-card p-10 text-center flex flex-col items-center justify-center max-w-lg mx-auto my-6 border-dashed border-border/80">
      <div className="h-10 w-10 rounded-lg bg-muted/60 border border-border flex items-center justify-center text-muted-foreground mb-3">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1 max-w-sm leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function CodeSnippet({
  code,
  language = "bash",
}: {
  code: string;
  language?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-lg border border-border bg-muted/40 font-mono text-xs overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/60 border-b border-border/60 text-[10px] text-muted-foreground">
        <span>{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-3 overflow-x-auto text-foreground/90">
        <code>{code}</code>
      </div>
    </div>
  );
}
