import Link from "next/link";
import type { ReactNode } from "react";
import {
  DashboardNav,
  type DashboardNavItem,
} from "@/components/dashboard/dashboard-nav";

export function DashboardShell({
  brand,
  brandHref,
  navItems,
  actions,
  children,
  sidebarFooter,
}: {
  brand: ReactNode;
  brandHref: string;
  navItems: DashboardNavItem[];
  actions?: ReactNode;
  children: ReactNode;
  sidebarFooter?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-background lg:flex lg:flex-col">
        <div className="flex h-[var(--header-height)] items-center border-b border-border px-4">
          <Link
            href={brandHref}
            className="text-sm font-semibold tracking-tight"
          >
            {brand}
          </Link>
        </div>
        <div className="flex flex-1 flex-col justify-between overflow-y-auto">
          <DashboardNav items={navItems} />
          {sidebarFooter ? (
            <div className="border-t border-border p-3 text-xs text-muted-foreground">
              {sidebarFooter}
            </div>
          ) : null}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass-nav sticky top-0 z-40 flex h-[var(--header-height)] items-center justify-between gap-4 px-4 lg:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-4 lg:hidden">
            <Link href={brandHref} className="shrink-0 text-sm font-semibold">
              {brand}
            </Link>
          </div>
          <nav
            className="flex flex-1 gap-1 overflow-x-auto lg:hidden"
            aria-label="Mobile dashboard"
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-card/60 hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          {actions ? (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          ) : null}
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
