"use client";

import { useEffect } from "react";
import {
  TrendingUp,
  ShieldAlert,
  CheckCircle2,
  GitMerge,
  Clock,
  BarChart3,
  AlertTriangle,
  Activity,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useDashboardStore } from "@/lib/stores/dashboardStore";
import {
  MetricCard,
  PageHeader,
  GlassCard,
  LoadingSpinner,
} from "@/components/ui/shared";

function formatDateShort(dateStr?: string) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

export default function AnalyticsPage() {
  const {
    analytics,
    trends,
    loadingAnalytics,
    loadingTrends,
    fetchAnalytics,
    fetchTrends,
  } = useDashboardStore();

  useEffect(() => {
    fetchAnalytics();
    fetchTrends();
  }, [fetchAnalytics, fetchTrends]);

  if (loadingAnalytics) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <LoadingSpinner size="lg" label="Aggregating code review metrics..." />
      </div>
    );
  }

  const data = analytics ?? {
    reviews: { total: 0, completed: 0, failed: 0, running: 0 },
    findings_by_severity: { critical: 0, high: 0, medium: 0, low: 0 },
    findings_by_category: [],
    total_findings: 0,
    total_repositories: 0,
    avg_findings_per_review: 0,
    avg_resolution_time: 0,
  };

  const totalFindings = data.total_findings;
  const sev = data.findings_by_severity;
  const rev = data.reviews;
  const successRate = rev.total > 0 ? Math.round((rev.completed / rev.total) * 100) : 100;

  // Chart datasets
  const trendChartData = trends.map((t) => ({
    date: formatDateShort(t.date),
    critical: t.critical,
    high: t.high,
    other: t.other,
  }));

  const pipelineData = [
    { name: "Completed", value: rev.completed, fill: "#10b981" },
    { name: "Running", value: rev.running, fill: "#6366f1" },
    { name: "Failed", value: rev.failed, fill: "#f43f5e" },
  ];

  const categoryData = data.findings_by_category.slice(0, 8).map((c) => ({
    name: c.name.length > 14 ? c.name.slice(0, 14) + "…" : c.name,
    value: c.count,
    fill: "#6366f1",
  }));

  const radialData = [
    { name: "Success Rate", value: successRate, fill: "#10b981" },
    {
      name: "Code Hygiene",
      value: totalFindings > 0 ? Math.max(0, 100 - (sev.critical * 5)) : 95,
      fill: "#6366f1",
    },
    {
      name: "Security Health",
      value: totalFindings > 0 ? Math.max(0, 100 - sev.critical * 10 - sev.high * 3) : 100,
      fill: "#06b6d4",
    },
  ];

  return (
    <div className="mx-auto max-w-[1280px] p-4 sm:p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="Engineering Analytics"
        subtitle="Telemetry on automated code review throughput, vulnerability discovery, and resolution speed."
        icon={BarChart3}
        action={
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-muted border border-border px-3 py-1.5 rounded-md">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Telemetry Window: 30 Days</span>
          </div>
        }
      />

      {/* KPI Grid */}
      <div className="grid gap-3.5 grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total PRs Reviewed"
          value={rev.total}
          icon={<GitMerge className="h-4 w-4" />}
          trend={`+${rev.completed} completed`}
          trendUp
          accent="violet"
        />
        <MetricCard
          label="AI Findings"
          value={totalFindings}
          icon={<ShieldAlert className="h-4 w-4" />}
          trend="Total issues logged"
          trendUp={totalFindings === 0}
          accent="rose"
        />
        <MetricCard
          label="Avg. Processing Time"
          value={data.avg_resolution_time ? `${data.avg_resolution_time}s` : "—"}
          icon={<Clock className="h-4 w-4" />}
          trend="Pipeline latency"
          accent="cyan"
        />
        <MetricCard
          label="Review Pass Ratio"
          value={`${successRate}%`}
          icon={<CheckCircle2 className="h-4 w-4" />}
          trend="Clean PR status"
          trendUp={successRate >= 70}
          accent="emerald"
        />
      </div>

      {/* Main Trend Chart */}
      <div className="dev-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Code Quality Over Time</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Daily trend of pull request findings grouped by severity
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium font-mono text-muted-foreground">
            <span className="flex items-center gap-1.5 text-indigo-500 dark:text-indigo-400">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              Critical
            </span>
            <span className="flex items-center gap-1.5 text-orange-500 dark:text-orange-400">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              High
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
              Other
            </span>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          {trendChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendChartData}>
                <defs>
                  <linearGradient id="gcritical" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ghigh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gother" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#94a3b8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#888888", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#888888", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
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
                  dataKey="critical"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#gcritical)"
                  name="Critical"
                />
                <Area
                  type="monotone"
                  dataKey="high"
                  stroke="#f97316"
                  strokeWidth={1.5}
                  fill="url(#ghigh)"
                  name="High"
                  strokeDasharray="4 4"
                />
                <Area
                  type="monotone"
                  dataKey="other"
                  stroke="#94a3b8"
                  strokeWidth={1.5}
                  fill="url(#gother)"
                  name="Other"
                  opacity={0.7}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground font-mono">
              No trend data available for the selected period
            </div>
          )}
        </div>
      </div>

      {/* Middle Row: Severity Breakdown + Category Breakdown */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Severity Breakdown */}
        <div className="dev-card p-5 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-border">
            <div className="p-2 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-500">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Findings by Severity</h3>
              <p className="text-xs text-muted-foreground">Total: {totalFindings} findings identified</p>
            </div>
          </div>
          <div className="space-y-4 pt-1">
            {[
              { label: "Critical", count: sev.critical, color: "#f43f5e" },
              { label: "High", count: sev.high, color: "#f97316" },
              { label: "Medium", count: sev.medium, color: "#eab308" },
              { label: "Low", count: sev.low, color: "#6366f1" },
            ].map((item) => {
              const pct = totalFindings > 0 ? Math.round((item.count / totalFindings) * 100) : 0;
              return (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{item.label}</span>
                    <span className="font-mono text-foreground font-semibold">
                      {item.count} <span className="text-muted-foreground font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: item.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Issue Types */}
        <div className="dev-card p-5 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-border">
            <div className="p-2 rounded-md bg-primary/10 border border-primary/20 text-primary">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Top Issue Categories</h3>
              <p className="text-xs text-muted-foreground">Classified by security & architecture domains</p>
            </div>
          </div>
          {categoryData.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: "#888888", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fill: "#888888", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={90}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--popover)",
                      borderColor: "var(--border)",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "var(--popover-foreground)",
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} name="Count" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex flex-col items-center justify-center gap-2">
              <BarChart3 className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground font-mono">No category distribution recorded</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Pipeline Health & Radial Metrics */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Pipeline Status Breakdown */}
        <div className="dev-card p-5 lg:col-span-2 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-border">
            <div className="p-2 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-500">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Review Pipeline Velocity</h3>
              <p className="text-xs text-muted-foreground">Execution status across queued pull requests</p>
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={
                  trendChartData.length > 0
                    ? trendChartData
                    : [{ date: "Current", critical: sev.critical, high: sev.high, other: sev.low + sev.medium }]
                }
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#888888", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#888888", fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--popover)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "var(--popover-foreground)",
                  }}
                />
                <Bar dataKey="critical" fill="#6366f1" radius={[4, 4, 0, 0]} name="Critical" />
                <Bar dataKey="high" fill="#06b6d4" radius={[4, 4, 0, 0]} name="High" />
                <Bar dataKey="other" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Other" opacity={0.6} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 pt-2 border-t border-border flex-wrap">
            {pipelineData.map((p) => (
              <div key={p.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full" style={{ background: p.fill }} />
                <span>
                  {p.name}: <strong className="text-foreground font-mono">{p.value}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Radial Health Metrics */}
        <div className="dev-card p-5 space-y-4">
          <div className="pb-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Workspace Health Indices</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Composite telemetry scores</p>
          </div>
          <div className="h-44 relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="30%"
                outerRadius="100%"
                data={radialData}
                startAngle={180}
                endAngle={0}
              >
                <RadialBar dataKey="value" cornerRadius={6} background={{ fill: "rgba(148, 163, 184, 0.1)" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--popover)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "var(--popover-foreground)",
                  }}
                  formatter={(value) => [`${value != null ? Math.round(Number(value)) : 0}%`, ""]}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2.5 pt-2 border-t border-border">
            {radialData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: d.fill }} />
                  <span className="text-muted-foreground">{d.name}</span>
                </div>
                <span className="font-mono font-semibold text-foreground">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
