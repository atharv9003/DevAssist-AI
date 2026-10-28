import { ChapterOut } from "@/lib/api/chapters";
import { Circle } from "lucide-react";

export function ChapterListItem({
  chapter,
  selected,
  onClick,
}: {
  chapter: ChapterOut;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3.5 py-3 flex items-start gap-2.5 transition-colors cursor-pointer ${
        selected
          ? "bg-primary/10 border-l-2 border-l-primary text-foreground"
          : "hover:bg-muted/40 border-l-2 border-l-transparent text-muted-foreground"
      }`}
    >
      <div className="mt-1 text-muted-foreground/60 shrink-0">
        <Circle className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-xs font-semibold truncate ${selected ? "text-primary" : "text-foreground"}`}>
          {chapter.order}. {chapter.title}
        </p>
        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{chapter.summary}</p>
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {chapter.finding_count > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20">
              {chapter.finding_count} findings
            </span>
          )}
          {chapter.key_changes.length > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20">
              {chapter.key_changes.length} notes
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
