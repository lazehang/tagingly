import Link from "next/link";
import { Button } from "@repo/ui/button";
import { MarketingImage } from "@/components/marketing/marketing-image";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-border/60 marketing-gradient-mesh">
      <div className="app-container relative grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
        <div className="marketing-fade-up order-2 lg:order-1">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary shadow-sm backdrop-blur-sm">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full bg-primary ai-glow-dot"
              aria-hidden
            />
            AI face matching · Built for real events
          </p>
          <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem]">
            Every guest gets their photos—
            <span className="brand-gradient-text"> in minutes, not days</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-foreground/80 sm:text-xl">
            Stop hand-tagging thousands of shots. Upload once, let AI propose
            matches, and give each attendee a private gallery of only the images
            they appear in.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="shadow-md">
              <Link href="/register">Find my photos</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-border bg-card/60 backdrop-blur-sm"
            >
              <Link href="/admin">For organizers</Link>
            </Button>
          </div>
          <p className="mt-5 text-sm text-foreground/75">
            Already registered?{" "}
            <Link
              href="/login"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>{" "}
            or visit your{" "}
            <Link
              href="/portal"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              portal
            </Link>
            .
          </p>
        </div>

        <div className="relative order-1 lg:order-2">
          <div className="glass-panel-strong overflow-hidden p-2 marketing-float">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg">
              <MarketingImage
                src="/marketing/hero-event.jpg"
                alt="Guests celebrating at an event"
                priority
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/80 via-primary/5 to-accent-brand/15"
                aria-hidden
              />
            </div>
          </div>
          <div className="glass-panel absolute -bottom-4 -left-4 hidden w-40 overflow-hidden p-1.5 sm:block marketing-float-delayed">
            <div className="relative aspect-square w-full overflow-hidden rounded-md">
              <MarketingImage
                src="/marketing/guest-gallery.jpg"
                alt="Private photo gallery preview"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
