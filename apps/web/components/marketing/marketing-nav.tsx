"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@repo/ui/utils";
import { MarketingPill } from "@/components/marketing/marketing-pill";
import { PLATFORM_NAME } from "@/lib/brand";

const links = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#for-organizers", label: "For organizers" },
  { href: "#for-attendees", label: "For attendees" },
] as const;

export function MarketingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="mkt-nav sticky top-0 z-50">
      <div className="app-container flex h-16 items-center justify-between gap-3">
        <Link
          href="/"
          className="font-display shrink-0 text-lg font-semibold tracking-tight text-[var(--mkt-ink)]"
        >
          {PLATFORM_NAME}
        </Link>

        <nav
          className="hidden items-center gap-6 min-[900px]:flex"
          aria-label="Main navigation"
        >
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-[var(--mkt-ink-muted)] transition-colors hover:text-[var(--mkt-ink)]"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="text-sm font-medium text-[var(--mkt-ink-muted)] transition-colors hover:text-[var(--mkt-ink)]"
          >
            Sign in
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <MarketingPill href="/register" className="hidden px-4 text-sm min-[900px]:inline-flex">
            Find my photos
          </MarketingPill>
          <button
            type="button"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-[var(--mkt-panel-border)] text-[var(--mkt-ink)] min-[900px]:hidden"
            aria-expanded={open}
            aria-controls="marketing-mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <svg
              aria-hidden
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              {open ? (
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      <div
        id="marketing-mobile-nav"
        className={cn(
          "border-t border-[var(--mkt-panel-border)] min-[900px]:hidden",
          open ? "block" : "hidden"
        )}
      >
        <nav className="app-container flex flex-col gap-1 py-3" aria-label="Mobile navigation">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="min-h-[44px] py-2 text-sm font-medium text-[var(--mkt-ink)]"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="min-h-[44px] py-2 text-sm font-medium text-[var(--mkt-ink-muted)]"
            onClick={() => setOpen(false)}
          >
            Sign in
          </Link>
          <MarketingPill href="/register" className="mt-2 w-full">
            Find my photos
          </MarketingPill>
        </nav>
      </div>
    </header>
  );
}
