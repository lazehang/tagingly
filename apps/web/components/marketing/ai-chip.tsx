import { cn } from "@repo/ui/utils";

type AiChipProps = {
  label?: string;
  className?: string;
};

/** Lilac pill — the only marketing cue for AI-active state. */
export function AiChip({ label = "AI proposed", className }: AiChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-[var(--mkt-ai)] px-2.5 py-0.5 text-[13px] font-medium leading-none text-[var(--mkt-ai-ink)]",
        className
      )}
    >
      {label}
    </span>
  );
}
