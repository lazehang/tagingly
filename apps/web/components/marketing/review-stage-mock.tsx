import { cn } from "@repo/ui/utils";
import { AiChip } from "@/components/marketing/ai-chip";
import { MarketingImage } from "@/components/marketing/marketing-image";

type ReviewStageMockProps = {
  floating?: boolean;
  className?: string;
  thumbSrc?: string;
  thumbAlt?: string;
  thumbClassName?: string;
};

/** Marketing-only review UI mock (`data-ui`). Fictional guest — not live product chrome. */
export function ReviewStageMock({
  floating = false,
  className,
  thumbSrc = "/marketing/event-crowd.jpg",
  thumbAlt = "Crop of an event photo awaiting tag review",
  thumbClassName = "object-[center_35%]",
}: ReviewStageMockProps) {
  return (
    <article
      data-ui
      aria-label="Example admin review: AI suggested tag awaiting approval"
      className={cn(
        "mkt-cream-card-strong relative w-full max-w-[380px] p-4 sm:p-5",
        floating && "mkt-review-float",
        className
      )}
    >
      <div className="absolute -top-3 right-4">
        <AiChip />
      </div>
      <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-lg ring-1 ring-[var(--mkt-cream-ink)]/10">
        <MarketingImage src={thumbSrc} alt={thumbAlt} className={thumbClassName} />
        <div
          className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-[var(--mkt-match-line)] ring-inset"
          aria-hidden
        />
      </div>
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--mkt-field)] text-sm font-semibold text-[var(--mkt-ink)]"
          aria-hidden
        >
          AM
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-[var(--mkt-cream-ink)]">
            Alex M.
          </p>
          <p className="text-sm text-[var(--mkt-cream-ink)]/70">
            Suggested · 87{" "}
            <span className="sr-only">(illustrative demo score, not live accuracy)</span>
          </p>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          className="min-h-[var(--mkt-pill-height)] flex-1 rounded-[var(--mkt-pill-radius)] bg-emerald-900/90 px-3 text-sm font-medium text-emerald-50"
        >
          Approve
        </button>
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          className="min-h-[var(--mkt-pill-height)] flex-1 rounded-[var(--mkt-pill-radius)] border-[1.5px] border-[color:rgb(26_18_14/0.35)] bg-transparent px-3 text-sm font-medium text-[var(--mkt-cream-ink)]"
        >
          Reject
        </button>
      </div>
    </article>
  );
}
