"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ReviewProgress } from "@/components/ReviewProgress";
import { FindingCard } from "@/components/FindingCard";
import { DocumentationTab } from "@/components/DocumentationTab";
import { BlastRadiusGraph } from "@/components/BlastRadiusGraph";
import {
  ArrowLeft,
  GitBranch,
  Code2,
  GitPullRequest,
  Calendar,
  Clock,
  FileCode2,
  Activity,
  ShieldAlert,
  XCircle,
  CheckCircle2,
  ChevronRight,
  Network,
  AlertTriangle,
  FileWarning,
  BookOpen,
  Layers,
  Copy,
  Check,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ProloguePanel } from "@/components/prologue/ProloguePanel";
import { PierreDiffViewer } from "@/components/diff/PierreDiffViewer";
import { StatusBadge, LoadingSpinner, PageHeader, EmptyState } from "@/components/ui/shared";

type Tab = "prologue" | "chapters" | "findings" | "impact" | "documentation";

interface Review {
  id: number;
  status: string;
  summary?: string;
  commit_sha?: string;
  created_at: string;
  completed_at?: string;
  pr_title?: string;
  pr_number?: number;
  repo_name?: string;
  provider?: string;
  total_findings?: number;
}

interface Finding {
  id: number;
  file_path: string;
  line_start: number;
  severity: string;
  category: string;
  message: string;
  code_fix?: string | null;
  tool_source: string;
  is_suppressed: boolean;
}

interface ImpactReport {
  affected_files: string[];
  blast_radius: number;
  changed_files: string[];
  callers: Record<string, string[]>;
}

async function readJson<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

function ImpactTab({
  reviewId,
  isCompleted,
}: {
  reviewId: number;
  isCompleted: boolean;
}) {
  const [impact, setImpact] = useState<ImpactReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isCompleted) {
      setLoading(false);
      return;
    }
    fetch(`/api/v3/reviews/${reviewId}/impact`)
      .then((res) =>
        readJson<{
          affected_files: string[];
          blast_radius: number;
          changed_files: string[];
          callers: Record<string, string[]>;
        }>(res)
      )
      .then((data) => {
        setImpact(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [reviewId, isCompleted]);

  if (!isCompleted) {
    return (
      <div className="dev-card text-center py-12 p-6">
        <Network className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-60" />
        <p className="text-muted-foreground text-xs font-mono">
          Blast radius and impact analysis is calculated upon review completion.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-16 flex justify-center">
        <LoadingSpinner size="md" label="Analyzing AST call graphs..." />
      </div>
    );
  }

  if (error || !impact) {
    return (
      <div className="dev-card p-6 text-center text-xs text-destructive font-mono">
        Unable to load impact graph data for this review.
      </div>
    );
  }

  const {
    blast_radius: blastRadius,
    affected_files: affectedFiles = [],
    changed_files: changedFiles = [],
    callers = {},
  } = impact;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="dev-card p-4 flex items-center gap-3.5">
          <div className="p-2.5 rounded-md bg-orange-500/10 border border-orange-500/20 text-orange-500 shrink-0">
            <Network className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground font-mono block">BLAST RADIUS</span>
            <span className="text-xl font-semibold text-foreground font-mono leading-none">
              {blastRadius || affectedFiles.length}{" "}
              <span className="text-xs font-normal text-muted-foreground">files</span>
            </span>
          </div>
        </div>

        <div className="dev-card p-4 flex items-center gap-3.5">
          <div className="p-2.5 rounded-md bg-primary/10 border border-primary/20 text-primary shrink-0">
            <FileWarning className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground font-mono block">DIRECTLY MODIFIED</span>
            <span className="text-xl font-semibold text-foreground font-mono leading-none">
              {changedFiles.length}{" "}
              <span className="text-xs font-normal text-muted-foreground">files</span>
            </span>
          </div>
        </div>
      </div>

      <BlastRadiusGraph
        changedFiles={changedFiles}
        affectedFiles={affectedFiles}
        callers={callers}
      />

      {affectedFiles.length > 0 && (
        <div className="dev-card p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <span>Indirectly Affected Files (Callers & Dependents)</span>
          </div>
          <ul className="divide-y divide-border text-xs font-mono">
            {affectedFiles.map((file) => (
              <li key={file} className="py-2.5 flex items-center justify-between text-foreground/80">
                <span>{file}</span>
                <span className="text-[10px] text-muted-foreground uppercase bg-muted px-1.5 py-0.2 rounded border border-border">
                  Downstream Dependency
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function ReviewDetailPage() {
  const params = useParams();
  const reviewId = Number(params.id);

  const [review, setReview] = useState<Review | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("findings");
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);

  const fetchReviewData = async () => {
    try {
      setLoading(true);
      const [reviewData, findingsData] = await Promise.all([
        readJson<Review>(await fetch(`/api/v3/reviews/${reviewId}`)),
        readJson<Finding[]>(await fetch(`/api/v3/reviews/${reviewId}/findings`)).catch(() => []),
      ]);
      setReview(reviewData);
      setFindings(findingsData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load review data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reviewId) fetchReviewData();
  }, [reviewId]);

  if (loading) {
    return (
      <div className="py-24 flex justify-center items-center">
        <LoadingSpinner size="lg" label="Loading pull request telemetry..." />
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="mx-auto max-w-[1280px] p-8">
        <div className="dev-card p-8 text-center space-y-3">
          <XCircle className="h-8 w-8 text-destructive mx-auto" />
          <h2 className="text-sm font-semibold text-foreground">Review Not Found</h2>
          <p className="text-xs text-muted-foreground">{error || "The requested review does not exist."}</p>
          <Link href="/reviews">
            <button className="text-xs text-primary hover:underline font-medium">
              &larr; Return to Reviews Queue
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const isCompleted = review.status.toLowerCase() === "completed";
  const isFailed = review.status.toLowerCase() === "failed";
  const criticalCount = findings.filter(
    (f) => f.severity.toLowerCase() === "critical" || f.severity.toLowerCase() === "error"
  ).length;

  return (
    <div className="mx-auto max-w-[1280px] p-4 sm:p-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
        <Link href="/reviews" className="hover:text-foreground transition-colors">
          Reviews
        </Link>
        <ChevronRight className="h-3 w-3 opacity-60" />
        <span className="text-foreground/90 font-medium">{review.repo_name}</span>
        {review.pr_number && (
          <>
            <ChevronRight className="h-3 w-3 opacity-60" />
            <span className="text-primary font-medium">PR #{review.pr_number}</span>
          </>
        )}
      </nav>

      {/* Review Header Banner */}
      <div className="dev-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-mono text-foreground/80 bg-muted px-2 py-0.5 rounded border border-border">
                {review.repo_name}
              </span>
              {review.commit_sha && (
                <span className="font-mono text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                  @{review.commit_sha.substring(0, 7)}
                </span>
              )}
              <StatusBadge status={review.status} />
            </div>
            <h1 className="text-lg font-semibold text-foreground tracking-tight truncate">
              {review.pr_title || `Review #${review.id}`}
            </h1>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono shrink-0">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border text-xs font-mono">
          <div>
            <span className="text-muted-foreground uppercase text-[10px] block">Total Findings</span>
            <span className="text-base font-semibold text-foreground">{findings.length}</span>
          </div>
          <div>
            <span className="text-muted-foreground uppercase text-[10px] block">Critical Issues</span>
            <span
              className={`text-base font-semibold ${
                criticalCount > 0 ? "text-destructive" : "text-emerald-500 dark:text-emerald-400"
              }`}
            >
              {criticalCount}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground uppercase text-[10px] block">Review Mode</span>
            <span className="text-base font-semibold text-primary">Ensemble v3</span>
          </div>
        </div>
      </div>

      {/* SSE Real-time Progress Bar */}
      {!isCompleted && !isFailed && (
        <ReviewProgress
          reviewId={reviewId}
          initialStatus={review.status}
          onComplete={() => fetchReviewData()}
        />
      )}

      {/* Review Summary */}
      {review.summary && (
        <div className="dev-card p-5 space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold block">
            Executive Summary
          </span>
          <p className="text-xs text-foreground/90 leading-relaxed font-sans whitespace-pre-wrap">
            {review.summary}
          </p>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex gap-1 border-b border-border text-xs font-medium overflow-x-auto">
        {[
          {
            id: "findings",
            label: `Findings (${findings.length})`,
            icon: <ShieldAlert className="h-3.5 w-3.5" />,
          },
          { id: "chapters", label: "Code Diffs", icon: <Layers className="h-3.5 w-3.5" /> },
          { id: "impact", label: "Impact Graph", icon: <Network className="h-3.5 w-3.5" /> },
          { id: "prologue", label: "Prologue", icon: <BookOpen className="h-3.5 w-3.5" /> },
          { id: "documentation", label: "Docs", icon: <FileCode2 className="h-3.5 w-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 -mb-px transition-colors cursor-pointer shrink-0 ${
              activeTab === tab.id
                ? "border-primary text-foreground font-semibold bg-muted/20"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === "findings" && (
          <div className="space-y-4">
            {findings.length === 0 ? (
              <EmptyState
                icon={ShieldCheck}
                title="Zero vulnerabilities detected"
                description="This pull request passed all security audits, code hygiene checks, and syntax verifications."
              />
            ) : (
              <div className="space-y-3">
                {findings.map((f) => (
                  <FindingCard key={f.id} finding={f} reviewId={reviewId} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "chapters" && (
          <PierreDiffViewer
            reviewId={reviewId}
            chapterId={selectedChapterId}
            onSelectChapter={setSelectedChapterId}
          />
        )}

        {activeTab === "impact" && (
          <ImpactTab reviewId={reviewId} isCompleted={isCompleted} />
        )}

        {activeTab === "prologue" && <ProloguePanel reviewId={reviewId} />}

        {activeTab === "documentation" && (
          <DocumentationTab reviewId={reviewId} isCompleted={isCompleted} />
        )}
      </div>
    </div>
  );
}
