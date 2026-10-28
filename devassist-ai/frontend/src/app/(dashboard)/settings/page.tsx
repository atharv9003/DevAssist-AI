"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Settings,
  Webhook,
  Key,
  Server,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  RefreshCw,
  GitBranch,
  Cpu,
  Database,
  Zap,
  FlaskConical,
  Loader2,
  Bell,
  Shield,
  ChevronDown,
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useDashboardStore, PipelineSettings } from "@/lib/stores/dashboardStore";
import { PageHeader } from "@/components/ui/shared";
import { apiFetch } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────────
interface SystemStatus {
  status: string;
  database: boolean;
  llm_provider: string;
  llm_model: string;
  version: string;
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: "success" | "error" }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-xl animate-in slide-in-from-bottom-3 duration-200 backdrop-blur-md text-xs font-medium font-mono ${
        type === "success"
          ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-500 dark:text-emerald-400"
          : "bg-destructive/15 border-destructive/30 text-destructive"
      }`}
    >
      {type === "success" ? (
        <CheckCircle2 className="h-4 w-4 shrink-0" />
      ) : (
        <AlertTriangle className="h-4 w-4 shrink-0" />
      )}
      <span>{msg}</span>
    </div>
  );
}

function SettingItem({ label, value, secret }: { label: string; value: string; secret?: boolean }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const display = secret && !revealed ? "••••••••••••••••" : value || "Not configured";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-border/60 last:border-0 text-xs">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">{label}</p>
        <p
          className={`mt-0.5 font-mono ${
            secret && !revealed ? "text-muted-foreground/40 tracking-widest" : "text-muted-foreground"
          }`}
        >
          {display}
        </p>
      </div>
      <div className="flex items-center gap-1 ml-4 shrink-0">
        {secret && (
          <button
            onClick={() => setRevealed((v) => !v)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label={revealed ? "Hide value" : "Reveal value"}
          >
            {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        )}
        {value && (
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Copy setting value"
          >
            {copied ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  children,
  accent = "violet",
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  accent?: "violet" | "cyan" | "emerald" | "rose";
}) {
  const accentMap: Record<string, string> = {
    violet: "text-primary bg-primary/10 border-primary/20",
    cyan: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
    emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    rose: "text-rose-500 bg-rose-500/10 border-rose-500/20",
  };
  return (
    <div className="dev-card p-5 space-y-4">
      <div className="flex items-center gap-2.5 pb-3 border-b border-border">
        <div className={`p-1.5 rounded-md border ${accentMap[accent]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div>{children}</div>
    </div>
  );
}

function ReviewModeCard({
  mode,
  emoji,
  title,
  description,
  detail,
  active,
  loading,
  onClick,
}: {
  mode: string;
  emoji: string;
  title: string;
  description: string;
  detail: string;
  active: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`group relative flex-1 min-w-[240px] rounded-xl border p-5 text-left transition-all cursor-pointer ${
        active
          ? "border-primary bg-primary/5 shadow-xs"
          : "border-border bg-card hover:border-primary/40 hover:bg-muted/30"
      } ${loading ? "opacity-60 cursor-wait" : ""}`}
    >
      {active && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[10px] font-mono font-semibold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider">
            Active
          </span>
        </div>
      )}

      <div
        className={`h-10 w-10 rounded-lg flex items-center justify-center text-lg mb-3 border transition-colors ${
          active ? "bg-primary/10 border-primary/20" : "bg-muted border-border"
        }`}
      >
        <span role="img" aria-label={title}>{emoji}</span>
      </div>

      <h4 className={`text-sm font-semibold mb-1 transition-colors ${active ? "text-primary" : "text-foreground"}`}>
        {title}
      </h4>
      <p className="text-xs text-muted-foreground leading-relaxed mb-3">
        {description}
      </p>
      <p className="text-[11px] font-mono text-muted-foreground/60">{detail}</p>

      {loading && (
        <div className="absolute inset-0 rounded-xl flex items-center justify-center bg-background/50 backdrop-blur-xs">
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
        </div>
      )}
    </button>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
        checked ? "bg-primary" : "bg-muted"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-background shadow-xs transform transition-transform ${
          checked ? "translate-x-4.5" : "translate-x-1"
        }`}
      />
    </button>
  );
}

type TabKey = "system" | "pipeline" | "integrations" | "api";

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "system", label: "System Status", icon: Server },
  { key: "pipeline", label: "Review Pipeline", icon: FlaskConical },
  { key: "integrations", label: "Webhooks", icon: Webhook },
  { key: "api", label: "API & Tokens", icon: Key },
];

export default function SettingsPage() {
  const { pipelineSettings, fetchPipelineSettings, setReviewMode } = useDashboardStore();
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [modeLoading, setModeLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("system");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const [emailNotif, setEmailNotif] = useState(true);
  const [inAppAlerts, setInAppAlerts] = useState(true);
  const [pushNotif, setPushNotif] = useState(false);
  const [summaryFreq, setSummaryFreq] = useState("Weekly");

  const showToast = useCallback((msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchStatus = async () => {
    setRefreshing(true);
    try {
      const data = await apiFetch<SystemStatus>("/api/v3/status");
      setSystemStatus(data);
    } catch {
      setSystemStatus(null);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchPipelineSettings();
  }, [fetchPipelineSettings]);

  const handleSetMode = async (mode: string) => {
    if (pipelineSettings?.review_mode === mode) return;
    setModeLoading(mode);
    try {
      await setReviewMode(mode);
      showToast(`Switched to ${mode === "fast" ? "Fast ⚡" : "Ensemble 🔬"} mode`, "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update mode", "error");
    } finally {
      setModeLoading(null);
    }
  };

  const qualityData = Array.from({ length: 14 }, (_, i) => ({
    v: 60 + Math.sin(i * 0.8) * 20 + Math.random() * 10,
  }));

  return (
    <div className="mx-auto max-w-[1280px] p-4 sm:p-6 space-y-6">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <PageHeader
        title="Settings & Configuration"
        subtitle="LLM inference routing, review ensemble pipelines, GitHub webhooks, and API keys."
        icon={Settings}
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border text-xs font-medium overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 -mb-px transition-colors cursor-pointer shrink-0 ${
              activeTab === tab.key
                ? "border-primary text-foreground font-semibold bg-muted/20"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── System Tab ──────────────────────────────────────────────────────── */}
      {activeTab === "system" && (
        <div className="space-y-6">
          {/* Status banner */}
          <div className="dev-card p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={`h-12 w-12 rounded-xl flex items-center justify-center border shrink-0 ${
                    systemStatus?.database
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-500"
                  }`}
                >
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h2 className="text-sm font-semibold text-foreground">Backend Service Status</h2>
                    {systemStatus?.database && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {systemStatus
                      ? systemStatus.database
                        ? `PostgreSQL connected · API Engine v${systemStatus.version}`
                        : "Database unreachable — check PostgreSQL service"
                      : "Connecting to backend…"}
                  </p>
                </div>
              </div>
              <button
                onClick={fetchStatus}
                disabled={refreshing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-card border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer self-start sm:self-auto"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                <span>Refresh Status</span>
              </button>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* LLM Routing */}
            <SectionCard title="AI / LLM Routing" icon={Cpu} accent="violet">
              <SettingItem label="LLM Provider" value={systemStatus?.llm_provider ?? "gemini"} />
              <SettingItem label="Active Inference Model" value={systemStatus?.llm_model ?? "gemini-2.5-flash"} />
              <SettingItem label="API Backend Version" value={systemStatus?.version ?? "3.0.0"} />
              <SettingItem label="PostgreSQL State" value={systemStatus?.database ? "Healthy" : "Offline"} />
            </SectionCard>

            {/* Notification Preferences */}
            <SectionCard title="Notification Preferences" icon={Bell} accent="cyan">
              <div className="space-y-1">
                {[
                  { label: "Email Notifications on Critical Bugs", value: emailNotif, onChange: setEmailNotif },
                  { label: "In-App Review Completion Alerts", value: inAppAlerts, onChange: setInAppAlerts },
                  { label: "Real-time Push Notifications", value: pushNotif, onChange: setPushNotif },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0 text-xs">
                    <p className="font-medium text-foreground">{item.label}</p>
                    <Toggle checked={item.value} onChange={item.onChange} />
                  </div>
                ))}
                <div className="flex items-center justify-between py-2.5 text-xs">
                  <p className="font-medium text-foreground">Summary Cadence</p>
                  <select
                    value={summaryFreq}
                    onChange={(e) => setSummaryFreq(e.target.value)}
                    className="bg-card border border-border rounded-md px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-primary font-mono cursor-pointer"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {/* ── Pipeline Tab ────────────────────────────────────────────────────── */}
      {activeTab === "pipeline" && (
        <div className="space-y-6">
          <div className="dev-card p-5">
            <div className="flex items-center gap-3.5">
              <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <FlaskConical className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Review Pipeline Architecture</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure multi-stage LLM evaluation strategy for pull request analyses.
                </p>
              </div>
            </div>
          </div>

          {/* Mode selector */}
          <div className="flex flex-col sm:flex-row gap-4">
            <ReviewModeCard
              mode="fast"
              emoji="⚡"
              title="Fast Mode"
              description="Single-model direct analysis. Fast, cost-efficient, and suitable for rapid iteration PRs."
              detail="1 LLM call · ~12s execution"
              active={pipelineSettings?.review_mode === "fast"}
              loading={modeLoading === "fast"}
              onClick={() => handleSetMode("fast")}
            />
            <ReviewModeCard
              mode="ensemble"
              emoji="🔬"
              title="Ensemble v3 Mode"
              description="Three-stage multi-agent pipeline: Distill Context → Deep Reasoning → Finding Validation."
              detail="3 LLM calls · High precision verification"
              active={pipelineSettings?.review_mode === "ensemble"}
              loading={modeLoading === "ensemble"}
              onClick={() => handleSetMode("ensemble")}
            />
          </div>

          {pipelineSettings && (
            <div className="grid gap-5 lg:grid-cols-2">
              <SectionCard title="Active Pipeline Configuration" icon={Cpu} accent="violet">
                <SettingItem label="Configured Mode" value={pipelineSettings.review_mode} />
                <SettingItem label="Primary Model" value={pipelineSettings.llm_model} />
                <SettingItem label="Inference Provider" value={pipelineSettings.llm_provider} />
                <SettingItem label="Hybrid RAG AST Grounding" value={pipelineSettings.rag_enabled ? "Enabled" : "Disabled"} />
              </SectionCard>

              <div className="dev-card p-5 space-y-3">
                <div className="pb-2 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground">Historical Quality Index</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">14-day code quality telemetry</p>
                </div>
                <div className="h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={qualityData}>
                      <defs>
                        <linearGradient id="qgrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="v" stroke="#6366f1" strokeWidth={2} fill="url(#qgrad)" dot={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--popover)",
                          borderColor: "var(--border)",
                          borderRadius: "8px",
                          fontSize: "12px",
                          color: "var(--popover-foreground)",
                        }}
                        formatter={(v) => [`${v != null ? Math.round(Number(v)) : 0}%`, "Score"]}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Webhooks Tab ────────────────────────────────────────────────────── */}
      {activeTab === "integrations" && (
        <div className="space-y-6">
          {[
            {
              title: "GitHub Webhooks",
              desc: "Configure your GitHub repository to stream Pull Request webhook events to DevAssist AI.",
              endpoint: "https://<your-domain>/api/v3/github/webhook",
              items: [
                { label: "Content type", value: "application/json" },
                { label: "Events", value: "Pull requests (opened, synchronize, reopened)" },
                { label: "Secret", value: "Configured via GITHUB_WEBHOOK_SECRET env var" },
              ],
              docs: "https://docs.github.com/en/webhooks/using-webhooks/creating-webhooks",
            },
            {
              title: "GitLab Webhooks",
              desc: "Configure GitLab project settings to dispatch Merge Request webhooks to DevAssist AI.",
              endpoint: "https://<your-domain>/api/v3/gitlab/webhook",
              items: [
                { label: "Events", value: "Merge Request Events" },
                { label: "Secret Token", value: "Configured via GITLAB_WEBHOOK_SECRET env var" },
              ],
              docs: "https://docs.gitlab.com/ee/user/project/integrations/webhooks.html",
            },
          ].map((wh) => (
            <SectionCard key={wh.title} title={wh.title} icon={GitBranch} accent="cyan">
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{wh.desc}</p>
              <div className="rounded-lg bg-muted/60 border border-border p-3 font-mono text-xs flex items-center justify-between gap-3 mb-4">
                <code className="text-primary truncate">{wh.endpoint}</code>
                <button
                  onClick={() => navigator.clipboard.writeText(wh.endpoint)}
                  className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
                  title="Copy webhook URL"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <ul className="space-y-2 mb-4">
                {wh.items.map((row) => (
                  <li key={row.label} className="flex items-center gap-2.5 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                    <span className="text-muted-foreground font-medium">{row.label}:</span>
                    <span className="text-foreground font-mono">{row.value}</span>
                  </li>
                ))}
              </ul>
              <a
                href={wh.docs}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                <span>Read provider documentation</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </SectionCard>
          ))}
        </div>
      )}

      {/* ── API & Tokens Tab ─────────────────────────────────────────────────── */}
      {activeTab === "api" && (
        <div className="space-y-6">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-foreground/90 leading-relaxed font-mono">
              Tokens and secret keys are loaded securely from environment variables. To update credentials, edit your{" "}
              <code className="font-bold bg-muted px-1.5 py-0.5 rounded text-amber-500">.env</code> file and restart the backend.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <SectionCard title="Source Control Tokens" icon={Key} accent="violet">
              <SettingItem label="GitHub Personal Access Token" value="Configured via GITHUB_TOKEN" secret />
              <SettingItem label="GitLab Private Token" value="Configured via GITLAB_TOKEN" secret />
              <SettingItem label="GitHub Webhook Secret" value="Configured via GITHUB_WEBHOOK_SECRET" secret />
              <SettingItem label="GitLab Webhook Secret" value="Configured via GITLAB_WEBHOOK_SECRET" secret />
            </SectionCard>

            <SectionCard title="Inference Provider API Keys" icon={Cpu} accent="cyan">
              <SettingItem label="Google Gemini API Key" value="Configured via GEMINI_API_KEY" secret />
              <SettingItem label="OpenAI API Key" value="Configured via OPENAI_API_KEY" secret />

              {/* FastAPI docs links */}
              <div className="pt-4 mt-4 border-t border-border">
                <p className="text-xs font-semibold text-foreground mb-2.5">API Specification</p>
                <div className="flex gap-2.5 flex-wrap">
                  <a
                    href="/api/docs"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md bg-card border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    <span>Swagger UI</span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </a>
                  <a
                    href="/api/redoc"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md bg-card border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    <span>ReDoc</span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </a>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      )}
    </div>
  );
}
