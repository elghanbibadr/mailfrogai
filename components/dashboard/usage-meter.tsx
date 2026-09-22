import { cn } from "@/lib/utils";

export function UsageMeter({
  label,
  used,
  limit,
  className,
}: {
  label: string;
  used: number;
  limit: number | null;
  className?: string;
}) {
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const tone = !limit ? "bg-primary" : pct >= 100 ? "bg-destructive" : pct >= 80 ? "bg-amber-400" : "bg-primary";

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">
          {used} / {limit ?? "Unlimited"}
        </span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={limit ?? undefined}
        aria-valuenow={used}
      >
        <div className={cn("h-full rounded-full transition-all", tone)} style={{ width: limit ? `${pct}%` : "100%" }} />
      </div>
    </div>
  );
}
