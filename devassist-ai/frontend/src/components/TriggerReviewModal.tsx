"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Play,
  GitBranch,
  GitPullRequest,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  GitCommit,
  RefreshCw,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useDashboardStore, Repository } from "@/lib/stores/dashboardStore";

interface PullItem {
  number: number;
  title: string;
  author: string;
  state: string;
  url?: string;
  created_at?: string;
}

interface LatestCommitInfo {
  sha: string;
  full_sha?: string;
  message: string;
  author: string;
}

interface RepoPullsResponse {
  repo_id: number;
  repo_full_name: string;
  provider: string;
  latest_commit?: LatestCommitInfo | null;
  pulls: PullItem[];
}

interface TriggerReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRepoName?: string;
}

export function TriggerReviewModal({
  isOpen,
  onClose,
  initialRepoName,
}: TriggerReviewModalProps) {
  const router = useRouter();
  const { repositories, fetchRepositories, fetchReviews } = useDashboardStore();

  const [selectedRepoId, setSelectedRepoId] = useState<number | null>(null);
  const [pulls, setPulls] = useState<PullItem[]>([]);
  const [latestCommit, setLatestCommit] = useState<LatestCommitInfo | null>(null);
  const [loadingPulls, setLoadingPulls] = useState(false);

  // Review mode selection: "pr" or "latest_commit"
  const [targetMode, setTargetMode] = useState<"pr" | "latest_commit">("latest_commit");
  const [selectedPrNumber, setSelectedPrNumber] = useState<number | null>(null);
  const [customPrNumber, setCustomPrNumber] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Initialize repositories
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessMsg(null);
      if (repositories.length === 0) {
        fetchRepositories();
      }
    }
  }, [isOpen, repositories.length, fetchRepositories]);

  // Select initial repo
  useEffect(() => {
    if (isOpen && repositories.length > 0) {
      if (initialRepoName) {
        const found = repositories.find(
          (r) => r.full_name.toLowerCase() === initialRepoName.toLowerCase()
        );
        if (found) {
          setSelectedRepoId(found.id);
          return;
        }
      }
      if (!selectedRepoId) {
        setSelectedRepoId(repositories[0].id);
      }
    }
  }, [isOpen, repositories, initialRepoName, selectedRepoId]);

  // Fetch pulls when selected repo changes
  useEffect(() => {
    if (!selectedRepoId) return;
    async function loadPulls() {
      setLoadingPulls(true);
      setError(null);
      try {
        const data = await apiFetch<RepoPullsResponse>(
          `/api/v3/repositories/${selectedRepoId}/pulls`
        );
        setPulls(data.pulls || []);
        setLatestCommit(data.latest_commit || null);
        if (data.pulls && data.pulls.length > 0) {
          setTargetMode("pr");
          setSelectedPrNumber(data.pulls[0].number);
        } else {
          setTargetMode("latest_commit");
          setSelectedPrNumber(null);
        }
      } catch {
        setPulls([]);
        setLatestCommit(null);
        setTargetMode("latest_commit");
      } finally {
        setLoadingPulls(false);
      }
    }
    loadPulls();
  }, [selectedRepoId]);

  if (!isOpen) return null;

  const currentRepo = repositories.find((r) => r.id === selectedRepoId);

  async function handleTrigger() {
    if (!currentRepo) {
      setError("Please select a repository");
      return;
    }

    let prNum: number | undefined = undefined;
    if (targetMode === "pr") {
      if (customPrNumber.trim()) {
        const parsed = parseInt(customPrNumber.trim(), 10);
        if (isNaN(parsed) || parsed <= 0) {
          setError("Please enter a valid positive PR number");
          return;
        }
        prNum = parsed;
      } else if (selectedPrNumber) {
        prNum = selectedPrNumber;
      } else {
        setError("Please choose a PR or select 'Latest Commit Scan'");
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      await apiFetch("/api/v3/reviews/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: currentRepo.provider || "github",
          repo_full_name: currentRepo.full_name,
          pr_number: prNum ?? 0,
          commit_sha: targetMode === "latest_commit" ? latestCommit?.full_sha || latestCommit?.sha : undefined,
          title:
            targetMode === "pr"
              ? `PR #${prNum} Scan`
              : `Commit Scan (${latestCommit?.sha || "HEAD"}) - ${currentRepo.full_name}`,
        }),
      });

      setSuccessMsg("Review queued successfully! Redirecting...");
      await fetchReviews();

      setTimeout(() => {
        onClose();
        router.push("/reviews");
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to trigger review";
      setError(msg);
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-lg bg-card border border-border rounded-xl p-6 shadow-2xl text-card-foreground animate-in zoom-in-95 duration-150 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Trigger Code Review</h2>
              <p className="text-xs text-muted-foreground">
                Run automated multi-LLM code reviews and security analysis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Feedback alerts */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-500 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Repository Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground flex items-center justify-between">
            <span>Target Repository</span>
            <span className="text-[11px] font-mono text-muted-foreground">
              {repositories.length} connected
            </span>
          </label>
          <select
            value={selectedRepoId ?? ""}
            onChange={(e) => setSelectedRepoId(Number(e.target.value))}
            className="w-full rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none cursor-pointer font-mono"
          >
            {repositories.map((repo) => (
              <option key={repo.id} value={repo.id}>
                {repo.full_name} ({repo.provider})
              </option>
            ))}
          </select>
        </div>

        {/* Target Mode: PR vs Latest Commit */}
        <div className="space-y-3 pt-1">
          <label className="text-xs font-semibold text-foreground block">Review Target</label>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setTargetMode("latest_commit")}
              className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border font-medium transition-all cursor-pointer ${
                targetMode === "latest_commit"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <GitCommit className="h-4 w-4" />
              <span>Latest Commit</span>
            </button>

            <button
              type="button"
              onClick={() => setTargetMode("pr")}
              className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border font-medium transition-all cursor-pointer ${
                targetMode === "pr"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <GitPullRequest className="h-4 w-4" />
              <span>Pull Request {pulls.length > 0 && `(${pulls.length})`}</span>
            </button>
          </div>

          {/* Details for Latest Commit mode */}
          {targetMode === "latest_commit" && (
            <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                <span>DEFAULT BRANCH</span>
                <span className="text-foreground font-semibold">
                  {currentRepo?.default_branch || "main"}
                </span>
              </div>
              {latestCommit ? (
                <div className="pt-1 text-xs">
                  <div className="flex items-center gap-2 text-primary font-semibold">
                    <span className="px-1.5 py-0.5 rounded bg-primary/15 border border-primary/20 text-[10px]">
                      {latestCommit.sha}
                    </span>
                    <span className="text-foreground truncate">{latestCommit.message}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground pt-0.5">
                    by {latestCommit.author}
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground text-xs italic">
                  Will fetch and review changed files from the latest commit on default branch.
                </div>
              )}
            </div>
          )}

          {/* Details for PR mode */}
          {targetMode === "pr" && (
            <div className="space-y-2">
              {loadingPulls ? (
                <div className="p-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Checking open PRs from GitHub...</span>
                </div>
              ) : pulls.length > 0 ? (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {pulls.map((pr) => (
                    <div
                      key={pr.number}
                      onClick={() => {
                        setSelectedPrNumber(pr.number);
                        setCustomPrNumber("");
                      }}
                      className={`p-2.5 rounded-md border text-xs cursor-pointer transition-all flex items-center justify-between gap-2 ${
                        selectedPrNumber === pr.number && !customPrNumber
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-card hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono font-semibold text-primary">#{pr.number}</span>
                        <span className="truncate">{pr.title}</span>
                      </div>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-muted border border-border text-muted-foreground shrink-0">
                        {pr.state}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-md bg-muted/40 border border-border text-xs text-muted-foreground">
                  <p>No open pull requests found on GitHub for this repository.</p>
                  <p className="text-[11px] mt-1 text-foreground/80">
                    You can enter a PR number manually below, or switch to{" "}
                    <button
                      type="button"
                      onClick={() => setTargetMode("latest_commit")}
                      className="text-primary underline cursor-pointer"
                    >
                      Latest Commit
                    </button>
                    .
                  </p>
                </div>
              )}

              {/* Or manual PR input */}
              <div className="pt-1 flex items-center gap-2 text-xs">
                <span className="text-muted-foreground text-[11px] whitespace-nowrap">
                  Custom PR #:
                </span>
                <input
                  type="number"
                  placeholder="e.g. 1"
                  value={customPrNumber}
                  onChange={(e) => {
                    setCustomPrNumber(e.target.value);
                    if (e.target.value) setSelectedPrNumber(null);
                  }}
                  className="w-24 rounded border border-border bg-muted/30 px-2 py-1 text-xs text-foreground font-mono focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-3.5 py-1.5 rounded-md border border-border bg-card hover:bg-muted text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleTrigger}
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            {submitting ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Queuing Review...</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Start Review</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
