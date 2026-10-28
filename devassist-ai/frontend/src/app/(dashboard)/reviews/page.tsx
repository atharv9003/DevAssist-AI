"use client";

import { useEffect, useState, useMemo } from "react";
import {
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  ArrowRight,
  GitBranch,
  Code2,
  ListTodo,
  Trash2,
  Search,
  Filter,
  X,
  Plus,
  GitPullRequest,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useDashboardStore, ReviewItem } from "@/lib/stores/dashboardStore";
import { PageHeader, LoadingSpinner, StatusBadge, EmptyState } from "@/components/ui/shared";

function getStatusIcon(status: string) {
  switch (status?.toLowerCase()) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400 shrink-0" />;
    case "running":
      return <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-destructive shrink-0" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground shrink-0" />;
  }
}

export default function ReviewsPage() {
  const { reviews, loadingReviews, fetchReviews, deleteReview } = useDashboardStore();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const counts = useMemo(() => {
    return {
      all: reviews.length,
      completed: reviews.filter((r) => r.status.toLowerCase() === "completed").length,
      running: reviews.filter((r) => r.status.toLowerCase() === "running").length,
      failed: reviews.filter((r) => r.status.toLowerCase() === "failed").length,
    };
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const matchesFilter = filter === "all" || r.status.toLowerCase() === filter;
      const matchesSearch =
        search === "" ||
        (r.repo_name ? r.repo_name.toLowerCase().includes(search.toLowerCase()) : false) ||
        (r.pr_title ? r.pr_title.toLowerCase().includes(search.toLowerCase()) : false) ||
        (r.commit_sha ? r.commit_sha.toLowerCase().includes(search.toLowerCase()) : false);
      return matchesFilter && matchesSearch;
    });
  }, [reviews, filter, search]);

  const handleDelete = (id: number) => {
    deleteReview(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="mx-auto max-w-[1280px] p-4 sm:p-6 space-y-6">
      <PageHeader
        title="Pull Request Reviews"
        subtitle="Automated multi-LLM code reviews, security findings, and inline patch suggestions."
        icon={ListTodo}
        action={
          <Link href="/repositories">
            <button className="flex items-center gap-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer shadow-xs">
              <Plus className="h-3.5 w-3.5" />
              <span>Trigger Review</span>
            </button>
          </Link>
        }
      />

      {/* Filter & Search Bar */}
      <div className="dev-card p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-md border border-border w-full sm:w-auto overflow-x-auto">
          {[
            { id: "all", label: "All", count: counts.all },
            { id: "completed", label: "Completed", count: counts.completed },
            { id: "running", label: "Running", count: counts.running },
            { id: "failed", label: "Failed", count: counts.failed },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-md font-medium capitalize transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
                filter === f.id
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{f.label}</span>
              <span className="text-[10px] font-mono opacity-60">({f.count})</span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by repo, PR title, commit SHA..."
            className="w-full rounded-md border border-border bg-card py-1.5 pl-8 pr-8 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none font-mono"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Review List */}
      {loadingReviews ? (
        <div className="py-16 flex justify-center">
          <LoadingSpinner size="lg" label="Loading pull request reviews..." />
        </div>
      ) : filteredReviews.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title={search ? "No reviews match your query" : "No pull request reviews found"}
          description={
            search
              ? "Try adjusting your search keywords or clearing the active status filter."
              : "Connect a repository and trigger a scan to start receiving automated AI reviews."
          }
          action={
            <Link href="/repositories">
              <button className="flex items-center gap-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground px-3.5 py-1.5 text-xs font-medium cursor-pointer">
                <Plus className="h-3.5 w-3.5" />
                <span>Go to Repositories</span>
              </button>
            </Link>
          }
        />
      ) : (
        <div className="dev-card divide-y divide-border overflow-hidden">
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              className="p-4 hover:bg-muted/20 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="mt-1">{getStatusIcon(review.status)}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="font-mono text-foreground/80 bg-muted px-2 py-0.5 rounded border border-border">
                      {review.repo_name}
                    </span>
                    {review.pr_number && (
                      <span className="font-mono text-primary flex items-center gap-1">
                        <GitPullRequest className="h-3 w-3" />
                        PR #{review.pr_number}
                      </span>
                    )}
                    {review.commit_sha && (
                      <span className="font-mono text-muted-foreground text-[11px]">
                        @{review.commit_sha.substring(0, 7)}
                      </span>
                    )}
                    <span className="text-muted-foreground/40">&bull;</span>
                    <span className="text-muted-foreground text-[11px]">
                      {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-foreground mt-1 hover:text-primary transition-colors">
                    <Link href={`/reviews/${review.id}`}>
                      {review.pr_title || `Review #${review.id}`}
                    </Link>
                  </h3>

                  {review.summary && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1 font-sans">
                      {review.summary}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 justify-end">
                <StatusBadge status={review.status} />

                {deleteConfirmId === review.id ? (
                  <div className="flex items-center gap-1.5 bg-destructive/10 border border-destructive/20 px-2 py-1 rounded text-xs">
                    <span className="text-destructive font-mono text-[10px]">Delete?</span>
                    <button
                      onClick={() => handleDelete(review.id)}
                      className="text-destructive font-semibold hover:underline"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirmId(review.id)}
                    className="text-muted-foreground hover:text-destructive p-1.5 rounded transition-colors cursor-pointer"
                    title="Delete review"
                    aria-label={`Delete review ${review.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}

                <Link href={`/reviews/${review.id}`}>
                  <button className="flex items-center gap-1.5 rounded border border-border bg-card hover:bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition-colors cursor-pointer">
                    <span>Inspect</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
