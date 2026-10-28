"use client";

import { useChapters } from "@/hooks/useChapters";
import { ChapterListItem } from "./ChapterListItem";

export function ChapterList({
  reviewId,
  selectedChapterId,
  onSelect,
}: {
  reviewId: number;
  selectedChapterId: number | null;
  onSelect: (id: number) => void;
}) {
  const { data: chapters, isLoading } = useChapters(reviewId);

  if (isLoading)
    return (
      <aside className="w-full sm:w-72 border-b sm:border-b-0 sm:border-r border-border p-4 text-xs font-mono text-muted-foreground">
        Loading chapters...
      </aside>
    );
  if (!chapters || chapters.length === 0) return null;

  return (
    <aside className="w-full sm:w-72 border-b sm:border-b-0 sm:border-r border-border bg-card flex flex-col shrink-0">
      <div className="p-3.5 border-b border-border">
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
          Inspection Chapters ({chapters.length})
        </h3>
      </div>
      <div className="overflow-y-auto flex-1 divide-y divide-border/60">
        {chapters.map((c) => (
          <ChapterListItem
            key={c.id}
            chapter={c}
            selected={c.id === selectedChapterId}
            onClick={() => onSelect(c.id)}
          />
        ))}
      </div>
    </aside>
  );
}
