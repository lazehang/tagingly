import { cn } from "@repo/ui/utils";

export function StatCard({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "section-card flex flex-col gap-1 border-primary/15 p-4 shadow-[0_0_20px_-8px_hsl(var(--glow-primary)/0.2)]",
        className
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="font-display text-2xl font-semibold tabular-nums text-foreground">
        {value}
      </p>
      {hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
