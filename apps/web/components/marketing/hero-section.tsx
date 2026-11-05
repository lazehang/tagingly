import Link from "next/link";
import { MarketingImage } from "@/components/marketing/marketing-image";
import { MarketingPill } from "@/components/marketing/marketing-pill";
import { ProofStrip } from "@/components/marketing/proof-strip";
import { ReviewStageMock } from "@/components/marketing/review-stage-mock";

export function HeroSection() {
  return (
    <section className="border-b border-[var(--mkt-panel-border)]">
      <div className="app-container space-y-0 pb-2 pt-4 sm:pt-6">
        <div className="relative min-h-[52svh] overflow-hidden rounded-[var(--mkt-radius-stage)] min-[960px]:min-h-[75svh]">
          <MarketingImage
            src="/marketing/hero-stage.jpg"
            alt="Guests at a warm evening event"
            priority
            className="object-[42%_center] min-[960px]:object-[38%_center]"
          />
          <div className="mkt-hero-scrim pointer-events-none absolute inset-0" aria-hidden />
          <div className="relative flex min-h-[inherit] flex-col justify-end gap-8 p-5 min-[960px]:grid min-[960px]:grid-cols-[minmax(0,42%)_1fr] min-[960px]:items-end min-[960px]:gap-6 min-[960px]:p-8 lg:p-10">
            <div className="max-w-xl min-[960px]:pb-4">
              <h1 className="font-display text-[clamp(2.5rem,5vw,3.75rem)] font-medium leading-[0.95] tracking-[-0.03em] text-[var(--mkt-ink)]">
                Every guest gets their photos—
                <span className="block">in minutes, not days</span>
              </h1>
              <p className="mt-5 text-base leading-relaxed text-[var(--mkt-ink)] min-[960px]:mt-6 min-[960px]:text-[17px]">
                Upload once, let AI propose matches, and give each attendee a private
                gallery of only the images they appear in—after you review.
              </p>
              <div className="mt-8 flex w-full flex-col gap-3 min-[960px]:mt-10 min-[960px]:max-w-md min-[960px]:flex-row">
                <MarketingPill href="/register" className="w-full min-[960px]:w-auto">
                  Find my photos
                </MarketingPill>
                <MarketingPill
                  href="/admin"
                  variant="secondaryOnDark"
                  className="w-full min-[960px]:w-auto"
                >
                  For organizers
                </MarketingPill>
              </div>
              <p className="mt-4 text-sm text-[var(--mkt-ink-muted)]">
                Already registered?{" "}
                <Link href="/login" className="mkt-link font-medium text-[var(--mkt-ink)]">
                  Sign in
                </Link>{" "}
                ·{" "}
                <Link href="/portal" className="mkt-link font-medium text-[var(--mkt-ink)]">
                  portal
                </Link>
              </p>
            </div>
            <div className="hidden min-[960px]:flex min-[960px]:justify-end min-[960px]:pb-6">
              <ReviewStageMock floating />
            </div>
          </div>
        </div>

        <div className="min-[960px]:hidden">
          <ReviewStageMock className="mx-auto mt-6 max-w-none" />
        </div>

        <ProofStrip />
      </div>
    </section>
  );
}
