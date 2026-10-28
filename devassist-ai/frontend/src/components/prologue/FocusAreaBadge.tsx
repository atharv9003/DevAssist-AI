import { ShieldAlert, AlertTriangle, Info, Zap } from "lucide-react";

type Severity = "critical" | "high" | "medium" | "low" | string;

interface FocusArea {
  severity?: Severity;
  title: string;
  description?: string;
}

export function FocusAreaBadge({ area }: { area: FocusArea }) {
  let Icon = Info;
  let color = "text-primary bg-primary/10 border-primary/20";

  if (area.severity === "critical") {
    Icon = ShieldAlert;
    color = "text-rose-500 dark:text-rose-400 bg-rose-500/10 border-rose-500/20";
  } else if (area.severity === "high") {
    Icon = AlertTriangle;
    color = "text-orange-500 dark:text-orange-400 bg-orange-500/10 border-orange-500/20";
  } else if (area.severity === "medium") {
    Icon = Zap;
    color = "text-amber-500 dark:text-amber-400 bg-amber-500/10 border-amber-500/20";
  }

  return (
    <div className={`flex items-start gap-2.5 p-3 rounded-lg border ${color}`}>
      <Icon className="h-4 w-4 shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="font-semibold text-xs text-foreground">{area.title}</p>
        {area.description && (
          <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{area.description}</p>
        )}
      </div>
    </div>
  );
}
