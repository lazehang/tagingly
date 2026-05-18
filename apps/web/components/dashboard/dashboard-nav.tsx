"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@repo/ui/utils";

export type DashboardNavItem = {
  href: string;
  label: string;
  icon?: React.ReactNode;
  /** Match child paths (default: exact match only) */
  matchPrefix?: boolean;
};

export function DashboardNav({ items }: { items: DashboardNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5 p-3" aria-label="Dashboard">
      {items.map((item) => {
        const active = item.matchPrefix
          ? pathname === item.href || pathname.startsWith(`${item.href}/`)
          : pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.25)]"
                : "text-muted-foreground hover:bg-accent/80 hover:text-foreground"
            )}
          >
            {item.icon ? (
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                  active ? "bg-primary/20 text-primary" : "bg-card/80 text-muted-foreground"
                )}
              >
                {item.icon}
              </span>
            ) : null}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardSubNav({
  items,
  title,
}: {
  items: DashboardNavItem[];
  title?: string;
}) {
  return (
    <div className="mb-6 border-b border-border pb-4">
      {title ? (
        <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <SubNavTab key={item.href} item={item} />
        ))}
      </div>
    </div>
  );
}

function SubNavTab({ item }: { item: DashboardNavItem }) {
  const pathname = usePathname();
  const active = item.matchPrefix
    ? pathname === item.href || pathname.startsWith(`${item.href}/`)
    : pathname === item.href;

  return (
    <Link
      href={item.href}
      className={cn(
        "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-[0_0_16px_-4px_hsl(var(--glow-primary)/0.5)]"
          : "text-muted-foreground hover:bg-card/60 hover:text-foreground"
      )}
    >
      {item.label}
    </Link>
  );
}
