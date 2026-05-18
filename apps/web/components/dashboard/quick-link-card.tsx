import Link from "next/link";
import { cn } from "@repo/ui/utils";

export function QuickLinkCard({
  href,
  title,
  description,
  className,
}: {
  href: string;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "section-card group block p-4 transition-all hover:border-primary/40 hover:shadow-[0_0_24px_-8px_hsl(var(--glow-primary)/0.3)]",
        className
      )}
    >
      <h3 className="font-semibold text-foreground group-hover:text-primary">
        {title}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </Link>
  );
}
