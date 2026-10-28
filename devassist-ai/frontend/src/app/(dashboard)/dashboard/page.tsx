"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  FileCode2,
  ShieldAlert,
  Zap,
  ArrowRight,
  GitMerge,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Plus,
  GitBranch,
  Database,
  Terminal,
  ShieldCheck,
  Sparkles,
  Server,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useDashboardStore } from "@/lib/stores/dashboardStore";
import {
  MetricCard,
  PageHeader,
  GlassCard,
  LoadingSpinner,
  StatusBadge,
  EmptyState,
} from "@/components/ui/shared";

function formatTimeAgo(dateStr: string) {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (isNaN(diffMs) || diffMs < 0) return "Just now";
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return "Recently";
  }
}

export default function DashboardOverview() {
  const {
    statusData,
    analytics,
    reviews,
    trends,
    loadingAnalytics,
    loadingReviews,
    fetchStatus,
    fetchAnalytics,
    fetchReviews,
    fetchTrends,
  } = useDashboardStore();

  const [activeTab, setActiveTab] = useState<"all" | "attention" | "clean">("all");

  useEffect(() => {
    fetchStatus();
    fetchAnalytics();
    fetchReviews();
    fetchTrends();
  }, [fetchStatus, fetchAnalytics, fetchReviews, fetchTrends]);

  const recentReviews = reviews.slice(0, 6);
  const successRate = analytics?.reviews.total
    ? Math.round(
        (analytics.reviews.completed / analytics.reviews.total) * 100
      )
    : 100;

  const severityData = analytics
    ? [
        { name: "Critical", value: analytics.findings_by_severity.critical ?? 0, color: "#f43f5e" },
        { name: "High", value: analytics.findings_by_severity.high ?? 0, color: "#f97316" },
        { name: "Medium", value: analytics.findings_by_severity.medium ?? 0, color: "#eab308" },
      ].filter((d) => d.value > 0)
    : [];

  const trendChartData = (trends || []).map((t) => ({
    date: t.date?.slice(5) || "",
    reviews: t.reviews_count ?? ((t.critical ?? 0) + (t.high ?? 0) + (t.other ?? 0)),
    findings: t.findings_count ?? ((t.critical ?? 0) + (t.high ?? 0) + (t.other ?? 0)),
  }));

  const codeHealthScore = analytics
    ? Math.max(
        0,
        100 -
          (analytics.findings_by_severity.critical ?? 0) * 12 -
          (analytics.findings_by_severity.high ?? 0) * 4
      )
    : 98;

  const filteredRecentReviews = recentReviews.filter((r) => {
    if (activeTab === "attention") {
      return r.status.toLowerCase() === "failed" || r.status.toLowerCase() === "running";
    }
    if (activeTab === "clean") {
      return r.status.toLowerCase() === "completed";
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-[1280px] p-4 sm:p-6 space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Engineering Workspace"
        subtitle="Automated multi-LLM code reviews, security findings, and repository intelligence telemetry."
        badge={
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active Pipeline
          </span>
        }
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/search">
              <button className="flex items-center gap-2 rounded-md border border-border bg-card hover:bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition-colors cursor-pointer">
                <Database className="h-3.5 w-3.5 text-primary" />
                Query Codebase
              </button>
            </Link>
            <Link href="/repositories">
              <button className="flex items-center gap-1.5 rounded-md bg-primary hover:bg-primary/90 px-3.5 py-1.5 text-xs font-medium text-primary-foreground transition-colors shadow-xs cursor-pointer">
                <Plus className="h-3.5 w-3.5" />
                New PR Review
              </button>
            </Link>
          </div>
        }
      />

      {/* Quick Launch & Workflow Capabilities Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Link
          href="/search"
          className="dev-card p-3.5 hover:border-primary/40 hover:bg-muted/30 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-md bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 shrink-0">
              <Database className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-foreground block truncate">
                Semantic AST Search
              </span>
              <span className="text-[11px] text-muted-foreground truncate block">
                Query codebase logic & rules
              </span>
            </div>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
        </Link>

        <Link
          href="/reviews"
          className="dev-card p-3.5 hover:border-primary/40 hover:bg-muted/30 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-foreground block truncate">
                PR Review Queue
              </span>
              <span className="text-[11px] text-muted-foreground truncate block">
                Inspect inline code fixes
              </span>
            </div>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
        </Link>

        <Link
          href="/integrations"
          className="dev-card p-3.5 hover:border-primary/40 hover:bg-muted/30 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-md bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 shrink-0">
              <Server className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-foreground block truncate">
                MCP Tools & Bridges
              </span>
              <span className="text-[11px] text-muted-foreground truncate block">
                Configure stdio & SSE servers
              </span>
            </div>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
        </Link>

        <Link
          href="/analytics"
          className="dev-card p-3.5 hover:border-primary/40 hover:bg-muted/30 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
              <Activity className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-foreground block truncate">
                Health Telemetry
              </span>
              <span className="text-[11px] text-muted-foreground truncate block">
                Vulnerability trends & velocity
              </span>
            </div>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
        </Link>
      </div>

      {/* System Status Strip */}
      <div className="dev-card px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs border-border/70">
        <div className="flex items-center gap-5 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">Postgres:</span>
            <span className="font-mono text-foreground font-medium">Ready</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">Review Worker:</span>
            <span className="font-mono text-foreground font-medium">Celery Solo</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">RAG Embedding:</span>
            <span className="font-mono text-foreground font-medium">all-MiniLM-L6-v2</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-muted-foreground font-mono text-[11px]">
          <span>Provider: {statusData?.llm_provider || "gemini"}</span>
          <span className="text-border">&bull;</span>
          <span>Model: {statusData?.llm_model || "gemini-2.5-flash"}</span>
        </div>
      </div>

      {/* Primary KPI Summary Row */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total PR Reviews"
          value={analytics ? analytics.reviews.total : "—"}
          icon={<GitMerge className="h-4 w-4" />}
          trend="Automated scans"
          accent="violet"
          isLoading={loadingAnalytics}
          subtext={`${analytics?.reviews.completed ?? 0} successfully analyzed`}
        />
        <MetricCard
          label="Active Repositories"
          value={analytics ? analytics.total_repositories : "—"}
          icon={<FileCode2 className="h-4 w-4" />}
          trend="Connected & indexed"
          accent="cyan"
          isLoading={loadingAnalytics}
          subtext="FAISS embeddings synced"
        />
        <MetricCard
          label="Critical Vulnerabilities"
          value={analytics ? (analytics.findings_by_severity.critical ?? 0) : "—"}
          icon={<ShieldAlert className="h-4 w-4" />}
          trend={
            (analytics?.findings_by_severity.critical ?? 0) > 0
              ? "Action required"
              : "Zero critical issues"
          }
          trendUp={analytics ? (analytics.findings_by_severity.critical ?? 0) === 0 : undefined}
          accent="rose"
          isLoading={loadingAnalytics}
          subtext="JWT, Secrets, SQLi alerts"
        />
        <MetricCard
          label="Review Pass Rate"
          value={analytics ? `${successRate}%` : "—"}
          icon={<Zap className="h-4 w-4" />}
          trend="Clean PR ratio"
          trendUp={successRate >= 80}
          accent="emerald"
          isLoading={loadingAnalytics}
          subtext="Passed without blocker"
        />
      </div>

      {/* Visual Analytics Row */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Review & Finding Velocity Chart */}
        <div className="dev-card p-5 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-border">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Review & Finding Velocity</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Automated inspections and vulnerability detections over 30 days
                </p>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
                30-Day Window
              </span>
            </div>

            <div className="h-64 w-full pt-2">
              {trendChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendChartData}>
                    <defs>
                      <linearGradient id="reviewGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="findingsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#888888"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--popover)",
                        borderColor: "var(--border)",
                        borderRadius: "8px",
                        fontSize: "12px",
                        color: "var(--popover-foreground)",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="reviews"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#reviewGrad)"
                      name="Reviews"
                    />
                    <Area
                      type="monotone"
                      dataKey="findings"
                      stroke="#f43f5e"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      fillOpacity={1}
                      fill="url(#findingsGrad)"
                      name="Findings"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground font-mono">
                  No review telemetry recorded yet
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6 pt-3 border-t border-border text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="h-2 w-3 rounded-xs bg-indigo-500 inline-block" />
              <span>PR Reviews Run</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-3 rounded-xs bg-rose-500 inline-block" />
              <span>Vulnerabilities Detected</span>
            </div>
          </div>
        </div>

        {/* Security Posture & Vulnerability Breakdown Card */}
        <div className="dev-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Security Posture</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Vulnerability severity profile</p>
              </div>
              <span className="text-xs font-mono font-medium text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                Health: {codeHealthScore}/100
              </span>
            </div>

            {severityData.length > 0 ? (
              <div className="h-44 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={severityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={46}
                      outerRadius={68}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {severityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--popover)",
                        borderColor: "var(--border)",
                        borderRadius: "8px",
                        fontSize: "12px",
                        color: "var(--popover-foreground)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-center p-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 dark:text-emerald-400 mb-2 opacity-80" />
                <span className="text-xs font-semibold text-foreground">Clean Workspace</span>
                <span className="text-[11px] text-muted-foreground mt-0.5">
                  No active vulnerabilities recorded
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-3 border-t border-border text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                Critical (Secrets / Injection)
              </span>
              <span className="font-mono text-foreground font-semibold">
                {analytics?.findings_by_severity.critical ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-orange-500" />
                High Severity
              </span>
              <span className="font-mono text-foreground font-semibold">
                {analytics?.findings_by_severity.high ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Medium / Warnings
              </span>
              <span className="font-mono text-foreground font-semibold">
                {analytics?.findings_by_severity.medium ?? 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Pull Request Reviews Section */}
      <div className="dev-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Recent Pull Request Audits</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Automated multi-LLM inspection history and code findings
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-md border border-border text-xs">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                  activeTab === "all"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab("attention")}
                className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                  activeTab === "attention"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Need Review
              </button>
              <button
                onClick={() => setActiveTab("clean")}
                className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                  activeTab === "clean"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Clean
              </button>
            </div>

            <Link href="/reviews">
              <button className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1 cursor-pointer font-medium px-2 py-1">
                View all ({reviews.length}) &rarr;
              </button>
            </Link>
          </div>
        </div>

        {loadingReviews ? (
          <div className="py-12 flex justify-center">
            <LoadingSpinner size="md" label="Loading reviews telemetry..." />
          </div>
        ) : filteredRecentReviews.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <p className="text-xs text-muted-foreground font-mono">
              No reviews matched the current filter.
            </p>
            <Link href="/repositories">
              <button className="text-xs text-primary hover:underline font-medium">
                Trigger a scan from Repositories
              </button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredRecentReviews.map((rev) => (
              <div
                key={rev.id}
                className="py-3 flex items-center justify-between gap-4 hover:bg-muted/30 px-2 rounded-md transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-md bg-muted/60 border border-border flex items-center justify-center shrink-0">
                    <GitBranch className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/reviews/${rev.id}`}
                      className="text-xs font-semibold text-foreground hover:text-primary transition-colors truncate block"
                    >
                      {rev.pr_title || `Review #${rev.id}`}
                    </Link>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5 flex-wrap">
                      <span className="font-mono text-foreground/80">{rev.repo_name}</span>
                      {rev.pr_number && <span>&bull; PR #{rev.pr_number}</span>}
                      {rev.commit_sha && (
                        <span className="font-mono text-[10px] bg-muted px-1 rounded">
                          @{rev.commit_sha.substring(0, 7)}
                        </span>
                      )}
                      <span>&bull; {formatTimeAgo(rev.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={rev.status} />
                  <Link href={`/reviews/${rev.id}`}>
                    <button className="text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-muted transition-colors cursor-pointer">
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
