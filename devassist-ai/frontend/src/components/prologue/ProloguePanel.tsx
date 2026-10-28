"use client";

import { usePrologue } from "@/hooks/usePrologue";
import { MermaidDiagram } from "./MermaidDiagram";
import { FocusAreaBadge } from "./FocusAreaBadge";
import { LoadingSpinner } from "../ui/shared";
import { BookOpen } from "lucide-react";

export function ProloguePanel({ reviewId }: { reviewId: number }) {
  const { data: prologue, isLoading, error } = usePrologue(reviewId);

  if (isLoading)
    return (
      <div className="py-12 flex justify-center">
        <LoadingSpinner size="md" label="Synthesizing review prologue..." />
      </div>
    );
  if (error)
    return (
      <div className="dev-card p-6 text-center text-xs text-destructive font-mono">
        Failed to load prologue overview.
      </div>
    );
  if (!prologue) return null;

  const isFallback = prologue.motivation === "Could not determine motivation.";

  return (
    <section className="dev-card p-5 sm:p-6 space-y-5">
      <div className="flex items-center gap-2 pb-3 border-b border-border">
        <BookOpen className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Review Architecture & Intent</h2>
      </div>

      {isFallback && (
        <div className="text-amber-500 text-xs px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-md font-mono">
          ⚠ Prologue synthesis encountered an issue. Showing fallback context.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {prologue.motivation && (
          <div className="dev-card p-4 space-y-1 bg-muted/20">
            <h3 className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">
              PR Motivation & Context
            </h3>
            <p className="text-foreground/90 leading-relaxed font-sans">{prologue.motivation}</p>
          </div>
        )}

        {prologue.outcome && (
          <div className="dev-card p-4 space-y-1 bg-muted/20">
            <h3 className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">
              Expected System Outcome
            </h3>
            <p className="text-foreground/90 leading-relaxed font-sans">{prologue.outcome}</p>
          </div>
        )}
      </div>

      {prologue.diagram && (
        <div className="p-4 bg-muted/30 rounded-lg border border-border">
          <h3 className="text-[11px] font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
            Architecture Diagram
          </h3>
          <MermaidDiagram source={prologue.diagram} />
        </div>
      )}

      {prologue.focus_areas && prologue.focus_areas.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[11px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">
            Critical Focus Areas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {prologue.focus_areas.map((area, i) => (
              <FocusAreaBadge key={i} area={area} />
            ))}
          </div>
        </div>
      )}

      {prologue.complexity && (
        <div className="flex items-center gap-2 pt-2 border-t border-border text-xs font-mono">
          <span className="text-muted-foreground">Change Complexity:</span>
          <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary font-semibold capitalize">
            {prologue.complexity.level}
          </span>
          <span className="text-muted-foreground ml-2">{prologue.complexity.reasoning}</span>
        </div>
      )}
    </section>
  );
}
