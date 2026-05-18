import Link from "next/link";
import { Button } from "@repo/ui/button";
import { PLATFORM_NAME } from "@/lib/brand";

const links = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#for-organizers", label: "For organizers" },
  { href: "#for-attendees", label: "For attendees" },
] as const;

export function MarketingNav() {
  return (
    <header className="glass-nav sticky top-0 z-50 shadow-sm">
      <div className="app-container flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="font-display shrink-0 text-lg font-semibold tracking-tight"
        >
          <span className="brand-gradient-text">{PLATFORM_NAME}</span>
        </Link>
        <nav
          className="hidden items-center gap-6 md:flex"
          aria-label="Main navigation"
        >
          {links.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
          <Link href="/login" className="nav-link">
            Sign in
          </Link>
        </nav>
        <Button asChild size="sm" className="shrink-0 shadow-sm">
          <Link href="/register">Find my photos</Link>
        </Button>
      </div>
    </header>
  );
}
