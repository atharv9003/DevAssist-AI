"use client";

import { ChapterList } from "./ChapterList";
import { PatchDiff } from "@pierre/diffs/react";
import { useState, useEffect } from "react";
import { LoadingSpinner } from "../ui/shared";
import { FileCode2 } from "lucide-react";

export function PierreDiffViewer({
  reviewId,
  chapterId,
  onSelectChapter,
}: {
  reviewId: number;
  chapterId: number | null;
  onSelectChapter: (id: number) => void;
}) {
  const [diff, setDiff] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!chapterId) {
      setDiff(null);
      return;
    }

    setLoading(true);
    fetch(`/api/v3/reviews/${reviewId}/chapters/${chapterId}/diff`)
      .then((res) => res.json())
      .then((data) => {
        setDiff(data.diff);
      })
      .catch((err) => console.error("Failed to fetch diff:", err))
      .finally(() => setLoading(false));
  }, [reviewId, chapterId]);

  return (
    <div className="flex flex-col sm:flex-row dev-card min-h-[600px] overflow-hidden">
      <ChapterList reviewId={reviewId} selectedChapterId={chapterId} onSelect={onSelectChapter} />
      <div className="flex-1 p-5 text-foreground/80 bg-muted/20 overflow-y-auto">
        {!chapterId ? (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 text-muted-foreground font-mono text-xs">
            <FileCode2 className="h-8 w-8 mb-2 opacity-50" />
            <p>Select a file chapter from the list to view staged diffs.</p>
          </div>
        ) : loading ? (
          <div className="h-full min-h-[300px] flex items-center justify-center">
            <LoadingSpinner size="md" label="Loading chapter diff..." />
          </div>
        ) : diff ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground font-mono">
                Chapter #{chapterId} Inspection Diff
              </h3>
            </div>
            <div className="flex flex-col gap-4">
              {diff
                .split(/^(?=--- a\/|diff --git )/m)
                .filter((chunk) => chunk.trim().length > 0)
                .map((chunk, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg font-mono text-xs bg-card border border-border overflow-hidden"
                  >
                    <PatchDiff patch={chunk} />
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <div className="h-full min-h-[300px] flex items-center justify-center text-xs text-muted-foreground font-mono">
            <p>No diff available for this chapter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
