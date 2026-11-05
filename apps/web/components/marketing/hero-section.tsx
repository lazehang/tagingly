import Link from "next/link";
import { Button } from "@repo/ui/button";
import { MarketingImage } from "@/components/marketing/marketing-image";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-border/60 marketing-gradient-mesh">
      <div className="app-container relative grid items-center gap-0 py-6 min-[900px]:min-h-[70svh] min-[900px]:grid-cols-2 min-[900px]:gap-4 min-[900px]:py-12">
        <div className="relative order-1 min-[900px]:order-2 min-[900px]:sticky min-[900px]:top-20 min-[900px]:self-start">
          <div className="relative aspect-[4/3] min-h-[48svh] w-full max-w-[1000px] overflow-hidden rounded-[var(--radius)] min-[900px]:aspect-auto min-[900px]:min-h-[70svh] min-[900px]:max-w-none">
            <MarketingImage
              src="/marketing/hero-event.jpg"
              alt="Guest at a wedding reception showing a private event photo gallery on her phone"
              priority
            />
          </div>
        </div>

        <div className="marketing-album-card marketing-fade-up relative z-10 order-2 -mt-6 min-[900px]:order-1 min-[900px]:mt-0">
          <h1 className="font-display text-[clamp(2.25rem,4vw,3.5rem)] font-semibold leading-tight tracking-tight text-foreground">
            Every guest gets their photos—
            <span className="block brand-gradient-text">in minutes, not days</span>
          </h1>
          <p className="mt-6 text-base leading-relaxed text-foreground sm:text-lg">
            Stop hand-tagging thousands of shots. Upload once, let AI propose
            matches, and give each attendee a private gallery of only the images
            they appear in.
          </p>
          <div className="mt-10 flex min-h-[44px] flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="min-h-[44px] w-full shadow-md sm:w-auto">
              <Link href="/register">Find my photos</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="min-h-[44px] w-full border-border bg-card/60 backdrop-blur-sm sm:w-auto"
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
      </div>
    </section>
  );
}
