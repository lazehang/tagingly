import Link from "next/link";
import { cn } from "@repo/ui/utils";

export type NavItem = {
  href: string;
  label: string;
};

export function AppShell({
  brand,
  nav,
  actions,
  children,
}: {
  brand: React.ReactNode;
  nav: NavItem[];
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="glass-nav sticky top-0 z-40">
        <div className="app-container flex h-[var(--header-height)] items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-6">
            <Link
              href="/"
              className="shrink-0 text-sm font-semibold tracking-tight text-foreground"
            >
              {brand}
            </Link>
            <nav className="flex flex-wrap items-center gap-4">
              {nav.map((item) => (
                <Link key={item.href} href={item.href} className="nav-link">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          {actions ? (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          ) : null}
        </div>
      </header>
      <main className="app-container flex-1 py-8">{children}</main>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-wrap items-start justify-between gap-4",
        className
      )}
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
