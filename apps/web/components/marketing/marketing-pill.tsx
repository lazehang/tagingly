import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@repo/ui/utils";

export type MarketingPillVariant =
  | "primaryOnDark"
  | "secondaryOnDark"
  | "primaryOnCream"
  | "secondaryOnCream";

const variantClass: Record<MarketingPillVariant, string> = {
  primaryOnDark:
    "bg-[var(--mkt-cream-strong)] text-[var(--mkt-cream-ink)] hover:brightness-[1.03]",
  secondaryOnDark:
    "border-[1.5px] border-[color:rgb(247_243_238/0.42)] bg-[var(--mkt-panel)] text-[var(--mkt-ink)] hover:border-[color:rgb(247_243_238/0.55)]",
  primaryOnCream:
    "bg-[var(--mkt-field)] text-[var(--mkt-ink)] hover:brightness-110",
  secondaryOnCream:
    "border-[1.5px] border-[color:rgb(26_18_14/0.35)] bg-transparent text-[var(--mkt-cream-ink)] hover:border-[color:rgb(26_18_14/0.5)]",
};

type MarketingPillProps = {
  href: string;
  children: ReactNode;
  variant?: MarketingPillVariant;
  className?: string;
};

export function MarketingPill({
  href,
  children,
  variant = "primaryOnDark",
  className,
}: MarketingPillProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-[var(--mkt-pill-height)] items-center justify-center rounded-[var(--mkt-pill-radius)] px-5 text-[15px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mkt-ai)]",
        variantClass[variant],
        className
      )}
    >
      {children}
    </Link>
  );
}
