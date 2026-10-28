"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CircleDashed, Loader2 } from "lucide-react";

interface ReviewProgressProps {
  reviewId: number;
  initialStatus?: string;
  onComplete?: () => void;
}

interface PipelineEvent {
  event_type: string;
  message: string;
  stage?: string;
}

const STAGES = [
  { id: "distill", label: "Context Distillation" },
  { id: "reason", label: "Deep Reasoning" },
  { id: "validate", label: "Finding Validation" },
];

export function ReviewProgress({ reviewId, initialStatus, onComplete }: ReviewProgressProps) {
  const [events, setEvents] = useState<PipelineEvent[]>([]);
  const [status, setStatus] = useState(initialStatus || "PENDING");
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [completedStages, setCompletedStages] = useState<string[]>([]);

  useEffect(() => {
    if (status === "COMPLETED" || status === "FAILED") return;

    const eventSource = new EventSource(`/api/v3/events/${reviewId}`);

    eventSource.onmessage = (event) => {
      try {
        const data: PipelineEvent & { stage?: string } = JSON.parse(event.data);

        if (data.event_type === "REVIEW_STARTED") {
          setStatus("RUNNING");
        } else if (data.event_type === "STAGE_STARTED") {
          setActiveStage(data.stage ?? null);
        } else if (data.event_type === "STAGE_COMPLETED") {
          setCompletedStages((prev) => {
            const stage = data.stage ?? "";
            return prev.includes(stage) ? prev : [...prev, stage];
          });
          setActiveStage(null);
        } else if (data.event_type === "REVIEW_COMPLETED") {
          setStatus("COMPLETED");
          setCompletedStages(["distill", "reason", "validate"]);
          setActiveStage(null);
          onComplete?.();
          eventSource.close();
        } else if (data.event_type === "REVIEW_FAILED") {
          setStatus("FAILED");
          setActiveStage(null);
          eventSource.close();
        }

        setEvents((prev) => [...prev, data].slice(-6));
      } catch (err) {
        console.error("Failed to parse SSE event", err);
      }
    };

    eventSource.onerror = () => {
      if (eventSource.readyState === EventSource.CLOSED) {
        console.debug("SSE connection closed by server.");
      }
    };

    return () => eventSource.close();
  }, [reviewId, status, onComplete]);

  // Hybrid auto-transition simulation when no real stage events are received
  useEffect(() => {
    if (status !== "RUNNING") return;

    const hasRealStageEvents = events.some(
      (e) => e.event_type === "STAGE_STARTED" || e.event_type === "STAGE_COMPLETED"
    );
    if (hasRealStageEvents) return;

    let timer: NodeJS.Timeout;

    if (completedStages.length === 0 && activeStage !== "distill") {
      setActiveStage("distill");
    }

    if (activeStage === "distill") {
      timer = setTimeout(() => {
        setCompletedStages(["distill"]);
        setActiveStage("reason");
      }, 3500);
    }

    if (activeStage === "reason") {
      timer = setTimeout(() => {
        setCompletedStages(["distill", "reason"]);
        setActiveStage("validate");
      }, 8000);
    }

    return () => clearTimeout(timer);
  }, [status, activeStage, completedStages, events]);

  const progress = completedStages.length / STAGES.length;

  return (
    <div className="dev-card p-5 sm:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Pipeline Inspection Live Stream</h3>
        <span
          className={`text-[11px] font-bold font-mono uppercase tracking-widest px-2.5 py-0.5 rounded border ${
            status === "RUNNING"
              ? "bg-primary/10 border-primary/25 text-primary"
              : status === "COMPLETED"
              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-500 dark:text-emerald-400"
              : status === "FAILED"
              ? "bg-rose-500/10 border-rose-500/25 text-rose-500 dark:text-rose-400"
              : "bg-muted border-border text-muted-foreground"
          }`}
        >
          {status}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Stages */}
      <div className="flex items-start justify-between relative py-2">
        {/* Connector line */}
        <div className="absolute top-7 left-8 right-8 h-px bg-border -z-0" />

        {STAGES.map((stage) => {
          const isCompleted = completedStages.includes(stage.id);
          const isActive = activeStage === stage.id;

          return (
            <div key={stage.id} className="flex flex-col items-center gap-2 bg-card px-2 z-10">
              <div
                className={`h-9 w-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isCompleted
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                    : isActive
                    ? "border-primary bg-primary/10 text-primary ring-4 ring-primary/20"
                    : "border-border bg-muted/40 text-muted-foreground/40"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                ) : isActive ? (
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
                ) : (
                  <CircleDashed className="h-4 w-4" />
                )}
              </div>
              <span
                className={`text-[11px] font-medium text-center ${
                  isActive
                    ? "text-primary font-semibold"
                    : isCompleted
                    ? "text-emerald-500 dark:text-emerald-400"
                    : "text-muted-foreground"
                }`}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Live SSE Event Log */}
      <div className="rounded-lg bg-muted/40 border border-border p-3 font-mono text-[11px] h-24 overflow-y-auto">
        {events.map((ev, i) => (
          <div key={i} className="mb-1 flex gap-2">
            <span className="text-muted-foreground/60 shrink-0">
              [{new Date().toLocaleTimeString()}]
            </span>
            <span
              className={
                ev.event_type.includes("ERROR") || ev.event_type.includes("FAILED")
                  ? "text-rose-500 dark:text-rose-400 shrink-0 font-semibold"
                  : "text-emerald-500 dark:text-emerald-400 shrink-0 font-semibold"
              }
            >
              {ev.event_type}:
            </span>
            <span className="text-foreground/80">{ev.message}</span>
          </div>
        ))}
        {events.length === 0 && (
          <div className="text-muted-foreground animate-pulse">
            Listening for real-time pipeline events on SSE channel...
          </div>
        )}
      </div>
    </div>
  );
}
