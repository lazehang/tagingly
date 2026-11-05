import type { ReactNode } from "react";
import Link from "next/link";
import { AiChip } from "@/components/marketing/ai-chip";
import { MarketingImage } from "@/components/marketing/marketing-image";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingPill } from "@/components/marketing/marketing-pill";
import { HeroSection } from "@/components/marketing/hero-section";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import { PLATFORM_NAME } from "@/lib/brand";

const steps = [
  {
    title: "Upload event photos",
    description:
      "Organizers create an event and bulk-upload crowd shots from weddings, conferences, or school days.",
    image: "/marketing/organizer-upload.jpg",
    alt: "Organizer at a laptop reviewing a bulk upload grid of digital event photo thumbnails",
    showAiChip: false,
  },
  {
    title: "AI proposes matches",
    description:
      "Face detection finds guests and suggests tags. Admins review each person before anything goes live.",
    image: "/marketing/event-crowd.jpg",
    alt: "Group at an outdoor event with illustrative face-suggestion outlines on a few faces",
    showAiChip: true,
  },
  {
    title: "Guests get their gallery",
    description:
      "Attendees register with selfies and see only the photos they appear in—browse, fix mistakes, download.",
    image: "/marketing/guest-gallery.jpg",
    alt: "Guest at a pavilion reception raising a smartphone to capture photos of the dance floor",
    showAiChip: false,
  },
] as const;

const trustItems = [
  {
    title: "Admin review",
    description:
      "Confirm or reject every proposed tag. Wrong matches stay out of guest galleries.",
  },
  {
    title: "Smarter over time",
    description:
      "Rejections and “not me” feedback are remembered so reprocessing skips bad pairs.",
  },
  {
    title: "Privacy by design",
    description:
      "Selfies and galleries are scoped to the event. Guests never browse the full album.",
  },
  {
    title: "Multi-selfie matching",
    description:
      "Up to five profile photos per guest improve accuracy across lighting and angles.",
  },
] as const;

const features = [
  {
    title: "Bulk photo upload",
    description:
      "Drop dozens of event images at once and process them in the background.",
  },
  {
    title: "Per-person tag review",
    description:
      "See names, emails, and match scores. Confirm, reject, or add someone manually.",
  },
  {
    title: "Exclusions & reprocess",
    description:
      "Removed tags teach the system. Re-run matching without losing confirmed work.",
  },
  {
    title: "Attendee carousel",
    description:
      "Guests flip through their confirmed shots with keyboard-friendly navigation.",
  },
  {
    title: "Gated downloads",
    description:
      "Organizers choose whether attendees can save originals from their gallery.",
  },
  {
    title: "Multi-selfie signup",
    description:
      "Registration accepts several reference photos for tougher lighting conditions.",
  },
] as const;

const faqs = [
  {
    q: "How does face matching work?",
    a: "When guests register, we extract face embeddings from their selfies and index them for that event only. Uploaded event photos are scanned for faces and compared against those embeddings. Suggested matches go to organizers for approval before guests see anything.",
  },
  {
    q: "Is my selfie private?",
    a: "Yes. Selfies are used only to match you within the event you joined. Other attendees cannot browse your selfie or photos you are not tagged in.",
  },
  {
    q: "What if I am tagged in a photo incorrectly?",
    a: "Open your portal and use “Not me in this photo.” That removes the image from your gallery and helps the system avoid suggesting you again on that shot.",
  },
  {
    q: "Do I need an event ID to register?",
    a: "No. Organizers share a registration link for your event. Open that page, add your details and selfies, and you are set—no codes to type.",
  },
  {
    q: "Can organizers download photos for everyone?",
    a: "Organizers manage uploads and tagging in the admin dashboard. Attendee downloads are optional and controlled per event by the organizer.",
  },
] as const;

const suggestedTags = ["Alex M.", "Jordan K.", "Sam R."] as const;

function SectionHeading({
  id,
  title,
  description,
}: {
  id?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <h2
        id={id}
        className="font-display text-[clamp(1.5rem,2.5vw,2.25rem)] font-medium tracking-tight text-[var(--mkt-ink)]"
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-base leading-relaxed text-[var(--mkt-ink-muted)]">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function CreamCheck({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-2.5 text-base leading-relaxed text-[var(--mkt-cream-ink)]/85">
      <span className="font-semibold text-[var(--mkt-cream-ink)]" aria-hidden>
        ✓
      </span>
      <span>{children}</span>
    </li>
  );
}

export default function HomePage() {
  return (
    <div className="marketing-page flex min-h-screen flex-col">
      <MarketingNav />

      <main>
        <HeroSection />

        <section
          id="how-it-works"
          className="border-b border-[var(--mkt-panel-border)] py-16 sm:py-20"
          aria-labelledby="how-it-works-heading"
        >
          <div className="app-container space-y-12">
            <SectionHeading
              id="how-it-works-heading"
              title="How it works"
              description="Three steps from upload to guest-ready galleries."
            />
            <ol className="grid list-none gap-6 min-[900px]:grid-cols-3">
              {steps.map((item, i) => (
                <ScrollReveal key={item.title} delayMs={i * 70}>
                  <li className="h-full">
                    <article className="mkt-cream-card marketing-card-lift relative flex h-full flex-col overflow-hidden p-0">
                      {item.showAiChip ? (
                        <div className="absolute right-3 top-3 z-10">
                          <AiChip label="AI" />
                        </div>
                      ) : null}
                      <div className="relative aspect-[16/10] w-full">
                        <MarketingImage src={item.image} alt={item.alt} />
                      </div>
                      <div className="flex flex-1 flex-col px-6 pb-6 pt-5 md:px-7 md:pb-7">
                        <h3 className="font-display text-lg font-medium text-[var(--mkt-cream-ink)]">
                          {item.title}
                        </h3>
                        <p className="mt-2 text-base leading-relaxed text-[var(--mkt-cream-ink)]/85">
                          {item.description}
                        </p>
                      </div>
                    </article>
                  </li>
                </ScrollReveal>
              ))}
            </ol>
          </div>
        </section>

        <section
          className="border-b border-[var(--mkt-panel-border)] py-16 sm:py-20"
          aria-labelledby="ai-beside-heading"
        >
          <div className="app-container space-y-10">
            <SectionHeading
              id="ai-beside-heading"
              title="AI proposes. You decide."
              description="Matches stay suggestions until an organizer confirms. Guests never see a tag you rejected."
            />
            <ScrollReveal>
              <div className="grid gap-6 min-[900px]:grid-cols-2 min-[900px]:items-stretch">
                <div className="relative min-h-[280px] overflow-hidden rounded-[var(--mkt-radius-stage)] min-[900px]:min-h-[360px]">
                  <MarketingImage
                    src="/marketing/hero-event.jpg"
                    alt="Warmly lit pavilion reception with guests mingling and capturing event photos"
                    className="object-[55%_40%]"
                  />
                </div>
                <article
                  data-ui
                  className="mkt-cream-card flex flex-col p-6 md:p-8"
                  aria-label="Example match proposals awaiting organizer review"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="font-display text-xl font-medium text-[var(--mkt-cream-ink)]">
                      Proposed tags
                    </h3>
                    <AiChip label="Matching…" />
                  </div>
                  <ul className="space-y-3">
                    {suggestedTags.map((name) => (
                      <li
                        key={name}
                        className="flex items-center justify-between rounded-lg border border-[color:rgb(26_18_14/0.12)] bg-[var(--mkt-cream-strong)] px-4 py-3"
                      >
                        <span className="text-base font-medium text-[var(--mkt-cream-ink)]">
                          {name}
                        </span>
                        <span className="text-sm text-[var(--mkt-cream-ink)]/65">
                          Suggested
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-5 text-base leading-relaxed text-[var(--mkt-cream-ink)]/85">
                    Face detection finds guests in each upload. You confirm or reject
                    before anything appears in attendee galleries.
                  </p>
                </article>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section className="border-b border-[var(--mkt-panel-border)] py-16 sm:py-20">
          <div className="app-container grid gap-6 min-[900px]:grid-cols-2 min-[900px]:gap-8">
            <ScrollReveal>
              <article
                id="for-organizers"
                className="mkt-cream-card marketing-card-lift scroll-mt-28 p-6 md:p-8"
              >
                <h3 className="font-display text-xl font-medium text-[var(--mkt-cream-ink)]">
                  I&apos;m organizing an event
                </h3>
                <ul className="mt-5 space-y-2.5">
                  <CreamCheck>Create events and bulk-upload crowd photos</CreamCheck>
                  <CreamCheck>Review AI-proposed tags by name and match score</CreamCheck>
                  <CreamCheck>Control whether guests can download their shots</CreamCheck>
                </ul>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <MarketingPill href="/admin" variant="primaryOnCream" className="w-full sm:w-auto">
                    Start as organizer
                  </MarketingPill>
                  <MarketingPill
                    href="/login"
                    variant="secondaryOnCream"
                    className="w-full sm:w-auto"
                  >
                    Sign in
                  </MarketingPill>
                </div>
              </article>
            </ScrollReveal>
            <ScrollReveal delayMs={90}>
              <article
                id="for-attendees"
                className="mkt-cream-card marketing-card-lift scroll-mt-28 p-6 md:p-8"
              >
                <h3 className="font-display text-xl font-medium text-[var(--mkt-cream-ink)]">
                  I attended an event
                </h3>
                <ul className="mt-5 space-y-2.5">
                  <CreamCheck>
                    Register from your organizer&apos;s link with up to five selfies
                  </CreamCheck>
                  <CreamCheck>Browse only photos you appear in—nothing else</CreamCheck>
                  <CreamCheck>Flag wrong tags and download when the organizer allows</CreamCheck>
                </ul>
                <div className="mt-8">
                  <MarketingPill href="/register" variant="primaryOnCream" className="w-full sm:w-auto">
                    Register for an event
                  </MarketingPill>
                </div>
              </article>
            </ScrollReveal>
          </div>
        </section>

        <section className="border-b border-[var(--mkt-panel-border)] py-16 sm:py-20">
          <div className="app-container space-y-12">
            <SectionHeading
              title="Quality you can stand behind"
              description="Automation where it helps. Human judgment where it matters."
            />
            <ScrollReveal>
              <ul className="grid list-none gap-4 sm:grid-cols-2 sm:gap-5">
                {trustItems.map((item) => (
                  <li key={item.title} className="mkt-cream-card p-6 md:p-7">
                    <h3 className="font-display text-lg font-medium text-[var(--mkt-cream-ink)]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-base leading-relaxed text-[var(--mkt-cream-ink)]/85">
                      {item.description}
                    </p>
                  </li>
                ))}
              </ul>
            </ScrollReveal>
          </div>
        </section>

        <section className="border-b border-[var(--mkt-panel-border)] py-16 sm:py-20">
          <div className="app-container space-y-12">
            <SectionHeading
              title="Everything in one place"
              description="From upload to guest delivery—no spreadsheets, no manual face hunting."
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f, i) => (
                <ScrollReveal key={f.title} delayMs={i * 55}>
                  <div className="mkt-cream-card marketing-card-lift h-full p-5 md:p-6">
                    <h3 className="font-semibold text-[var(--mkt-cream-ink)]">{f.title}</h3>
                    <p className="mt-2 text-base leading-relaxed text-[var(--mkt-cream-ink)]/85">
                      {f.description}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20" aria-labelledby="faq-heading">
          <div className="app-container space-y-10">
            <SectionHeading
              id="faq-heading"
              title="Questions"
              description="Quick answers for organizers and guests."
            />
            <div className="mkt-faq-panel mx-auto max-w-2xl divide-y divide-[var(--mkt-panel-border)]">
              {faqs.map((item) => (
                <details key={item.q} className="group px-5 py-1">
                  <summary className="flex min-h-[44px] cursor-pointer list-none items-center text-base font-medium text-[var(--mkt-ink)] marker:content-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mkt-ai)] [&::-webkit-details-marker]:hidden">
                    <span className="flex w-full items-center justify-between gap-4 py-2">
                      {item.q}
                      <span
                        className="text-xl font-normal text-[var(--mkt-ink-muted)] transition-transform group-open:rotate-45"
                        aria-hidden
                      >
                        +
                      </span>
                    </span>
                  </summary>
                  <p className="pb-4 text-base leading-relaxed text-[var(--mkt-ink-muted)]">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-[var(--mkt-panel-border)] py-14 sm:py-16">
          <div className="app-container">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-display text-[clamp(1.5rem,2.5vw,2rem)] font-medium tracking-tight text-[var(--mkt-ink)]">
                Ready to deliver photos guests actually want?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-[var(--mkt-ink-muted)]">
                Set up your event in the admin dashboard, or register with the link from
                your organizer.
              </p>
              <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                <MarketingPill href="/register" className="w-full sm:min-w-[10rem] sm:w-auto">
                  Find my photos
                </MarketingPill>
                <MarketingPill
                  href="/admin"
                  variant="secondaryOnDark"
                  className="w-full sm:min-w-[10rem] sm:w-auto"
                >
                  For organizers
                </MarketingPill>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--mkt-panel-border)] py-10">
        <div className="app-container">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm font-medium text-[var(--mkt-ink-muted)]">
              © {new Date().getFullYear()} {PLATFORM_NAME}
            </p>
            <nav
              className="flex flex-wrap justify-center gap-4 text-sm font-medium"
              aria-label="Footer"
            >
              <Link href="/login" className="mkt-link-muted">
                Login
              </Link>
              <Link href="/register" className="mkt-link-muted">
                Register
              </Link>
              <Link href="/admin" className="mkt-link-muted">
                Admin
              </Link>
              <Link href="/portal" className="mkt-link-muted">
                Portal
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
