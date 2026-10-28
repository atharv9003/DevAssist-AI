"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  GitBranch,
  Plus,
  ExternalLink,
  Settings,
  Code2,
  Layers,
  ShieldAlert,
  CheckCircle2,
  X,
  AlertCircle,
  Database,
  Play,
  Trash2,
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import { useDashboardStore, Repository } from "@/lib/stores/dashboardStore";
import { PageHeader, GlassCard, LoadingSpinner, EmptyState } from "@/components/ui/shared";

function Sparkline({ color = "#6366f1" }: { color?: string }) {
  const data = [
    { v: 30 },
    { v: 45 },
    { v: 28 },
    { v: 60 },
    { v: 52 },
    { v: 75 },
    { v: 68 },
    { v: 85 },
  ];
  return (
    <ResponsiveContainer width={90} height={32}>
      <LineChart data={data}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
        <Tooltip contentStyle={{ display: "none" }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

function Modal({ title, children, onClose }: ModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md bg-card border border-border rounded-xl p-6 shadow-2xl text-card-foreground animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function RepoCard({
  repo,
  onDelete,
}: {
  repo: Repository;
  onDelete: (id: number, name: string) => void;
}) {
  const reviewsCount = repo.reviewsCount ?? repo.reviews_count ?? 0;
  const openIssues = repo.openIssues ?? repo.open_issues ?? 0;
  const successRate = repo.successRate ?? repo.success_rate ?? 100;

  return (
    <div className="dev-card p-5 hover:border-primary/40 transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: repo info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
            <div className="p-1.5 rounded-md bg-muted border border-border text-foreground/70 shrink-0">
              {repo.provider === "github" ? (
                <GitBranch className="h-4 w-4" />
              ) : (
                <Code2 className="h-4 w-4" />
              )}
            </div>
            <h3 className="text-sm font-semibold text-foreground font-mono truncate">
              {repo.full_name}
            </h3>
            {repo.is_active && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-500 dark:text-emerald-400 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono mb-4 flex-wrap">
            <span>Branch: {repo.default_branch}</span>
            <span>&bull;</span>
            <span className="capitalize">Provider: {repo.provider}</span>
            <span>&bull;</span>
            <span>
              Connected:{" "}
              {new Date(repo.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center gap-6 sm:gap-8 text-xs">
            <div>
              <span className="text-base font-semibold text-foreground font-mono leading-none block">
                {reviewsCount}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
                Reviews Run
              </span>
            </div>
            <div>
              <span
                className={`text-base font-semibold font-mono leading-none block ${
                  openIssues > 0 ? "text-destructive" : "text-foreground"
                }`}
              >
                {openIssues}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
                Open Findings
              </span>
            </div>
            <div>
              <span className="text-base font-semibold text-foreground font-mono leading-none block">
                {successRate}%
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
                Pass Ratio
              </span>
            </div>
            <div className="hidden sm:block">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono block mb-1">
                Activity
              </span>
              <Sparkline color="#6366f1" />
            </div>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Link href={`/search?repo=${encodeURIComponent(repo.full_name)}`}>
            <button
              className="flex items-center gap-1.5 rounded-md bg-muted hover:bg-muted/80 border border-border px-2.5 py-1.5 text-xs text-foreground transition-colors cursor-pointer"
              title="Semantic code search on this repository"
            >
              <Database className="h-3.5 w-3.5 text-primary" />
              <span>Query RAG</span>
            </button>
          </Link>

          <a
            href={`https://${repo.provider}.com/${repo.full_name}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 rounded-md bg-card border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <span>GitHub</span>
            <ExternalLink className="h-3 w-3" />
          </a>

          <button
            onClick={() => onDelete(repo.id, repo.full_name)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-colors cursor-pointer"
            title="Deactivate repository"
            aria-label={`Deactivate ${repo.full_name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RepositoriesPage() {
  const {
    repositories,
    loadingRepositories,
    fetchRepositories,
    addRepository,
    removeRepository,
  } = useDashboardStore();

  const [isOpen, setIsOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [defaultBranch, setDefaultBranch] = useState("main");
  const [provider, setProvider] = useState<"github" | "gitlab">("github");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [deleteRepoId, setDeleteRepoId] = useState<number | null>(null);
  const [deleteRepoName, setDeleteRepoName] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchRepositories();
  }, [fetchRepositories]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const sanitizeRepoName = (input: string) => {
    let clean = input.trim();
    if (clean.endsWith(".git")) clean = clean.slice(0, -4);
    return clean.replace(/^(https?:\/\/[^/]+\/|git@[^:]+:)/, "").replace(/^\/+|\/+$/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    const cleanedName = sanitizeRepoName(fullName);
    if (!cleanedName || !cleanedName.includes("/")) {
      setFormError("Please enter a valid repository in owner/repo format or full URL.");
      setSubmitting(false);
      return;
    }

    try {
      await addRepository({ provider, full_name: cleanedName, default_branch: defaultBranch });
      setToast({ type: "success", message: `Connected ${cleanedName} successfully!` });
      setIsOpen(false);
      setFullName("");
      setDefaultBranch("main");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (deleteRepoId === null) return;
    setDeleting(true);
    try {
      await removeRepository(deleteRepoId);
      setToast({ type: "success", message: `Deactivated ${deleteRepoName}!` });
      setDeleteRepoId(null);
      setDeleteRepoName("");
    } catch (err) {
      setToast({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to deactivate",
      });
    } finally {
      setDeleting(false);
    }
  };

  const inputCls =
    "w-full bg-card border border-border rounded-lg px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono";

  return (
    <div className="mx-auto max-w-[1280px] p-4 sm:p-6 space-y-6">
      <PageHeader
        title="Repositories"
        subtitle="Manage connected code repositories, configure review branches, and inspect FAISS vector embeddings."
        icon={GitBranch}
        action={
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground px-3.5 py-1.5 text-xs font-medium transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Connect Repository</span>
          </button>
        }
      />

      {loadingRepositories ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" label="Loading connected repositories..." />
        </div>
      ) : repositories.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No repositories connected"
          description="Connect your GitHub or GitLab repositories to start receiving automated AI-powered PR reviews and semantic code search."
          action={
            <button
              onClick={() => {
                setProvider("github");
                setIsOpen(true);
              }}
              className="flex items-center gap-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 text-xs font-semibold cursor-pointer"
            >
              <GitBranch className="h-4 w-4" />
              <span>Connect First Repository</span>
            </button>
          }
        />
      ) : (
        <div className="grid gap-4">
          {repositories.map((repo) => (
            <RepoCard
              key={repo.id}
              repo={repo}
              onDelete={(id, name) => {
                setDeleteRepoId(id);
                setDeleteRepoName(name);
              }}
            />
          ))}
        </div>
      )}

      {/* Add Repository Modal */}
      {isOpen && (
        <Modal
          title="Connect Code Repository"
          onClose={() => {
            setIsOpen(false);
            setFormError(null);
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-xs text-destructive font-medium font-mono">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">
                Provider
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {(["github", "gitlab"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setProvider(p)}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                      provider === p
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-muted/40 border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {p === "github" ? <GitBranch className="h-4 w-4" /> : <Code2 className="h-4 w-4" />}
                    <span>{p.charAt(0).toUpperCase() + p.slice(1)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">
                Repository Name / URL
              </label>
              <input
                type="text"
                required
                placeholder="e.g. atharv9003/transitops or full URL"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputCls}
              />
              <p className="text-[11px] text-muted-foreground">
                Enter owner/repo or paste the complete git clone URL.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">
                Default Branch
              </label>
              <input
                type="text"
                required
                placeholder="main"
                value={defaultBranch}
                onChange={(e) => setDefaultBranch(e.target.value)}
                className={inputCls}
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setFormError(null);
                }}
                disabled={submitting}
                className="px-3.5 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-primary hover:bg-primary/90 text-xs font-semibold text-primary-foreground transition-colors disabled:opacity-60 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <LoadingSpinner size="sm" /> <span>Connecting...</span>
                  </>
                ) : (
                  <span>Connect Repository</span>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Deactivate Confirmation Modal */}
      {deleteRepoId !== null && (
        <Modal
          title="Deactivate Repository"
          onClose={() => {
            setDeleteRepoId(null);
            setDeleteRepoName("");
          }}
        >
          <div className="flex items-start gap-3.5 mb-5">
            <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 shrink-0 text-destructive">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-foreground/90 leading-relaxed">
                Are you sure you want to deactivate{" "}
                <span className="font-semibold text-foreground font-mono">{deleteRepoName}</span>?
                Automated webhook reviews will be paused for this repository.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
            <button
              onClick={() => {
                setDeleteRepoId(null);
                setDeleteRepoName("");
              }}
              disabled={deleting}
              className="px-3.5 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-destructive hover:bg-destructive/90 text-xs font-semibold text-destructive-foreground transition-colors disabled:opacity-60 cursor-pointer"
            >
              {deleting ? <span>Deactivating...</span> : <span>Confirm Deactivate</span>}
            </button>
          </div>
        </Modal>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg border shadow-xl animate-in slide-in-from-bottom-3 duration-200 backdrop-blur-md text-xs font-medium font-mono ${
            toast.type === "success"
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-500 dark:text-emerald-400"
              : "bg-destructive/15 border-destructive/30 text-destructive"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
