import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@repo/ui/button";
import { CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { MarketingImage } from "@/components/marketing/marketing-image";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { HeroSection } from "@/components/marketing/hero-section";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import { PLATFORM_NAME } from "@/lib/brand";

const steps = [
  {
    step: "1",
    title: "Upload event photos",
    description:
      "Organizers create an event and bulk-upload crowd shots from weddings, conferences, or school days.",
    image: "/marketing/organizer-upload.jpg",
    alt: "Organizer uploading event photos",
  },
  {
    step: "2",
    title: "AI proposes matches",
    description:
      "Face detection finds guests and suggests tags. Admins review each person before anything goes live.",
    image: "/marketing/event-crowd.jpg",
    alt: "AI matching faces in event photos",
  },
  {
    step: "3",
    title: "Guests get their gallery",
    description:
      "Attendees register with selfies and see only the photos they appear in—browse, fix mistakes, download.",
    image: "/marketing/guest-gallery.jpg",
    alt: "Guest viewing their private photo gallery",
  },
] as const;

const trustItems = [
  {
    title: "Admin review",
    description:
      "Confirm or reject every proposed tag. Wrong matches stay out of guest galleries.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
  },
  {
    title: "Smarter over time",
    description:
      "Rejections and “not me” feedback are remembered so reprocessing skips bad pairs.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
      />
    ),
  },
  {
    title: "Privacy by design",
    description:
      "Selfies and galleries are scoped to the event. Guests never browse the full album.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
      />
    ),
  },
  {
    title: "Multi-selfie matching",
    description:
      "Up to five profile photos per guest improve accuracy across lighting and angles.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-3.736 0l-.822 1.316z"
      />
    ),
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
    a: "Yes. Organizers share an event ID or registration link after they create the event. You will need that code when you sign up.",
  },
  {
    q: "Can organizers download photos for everyone?",
    a: "Organizers manage uploads and tagging in the admin dashboard. Attendee downloads are optional and controlled per event by the organizer.",
  },
] as const;

function IconBox({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary shadow-[0_0_16px_-4px_hsl(var(--glow-primary)/0.4)]">
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden
      >
        {children}
      </svg>
    </div>
  );
}

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
        className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-base leading-relaxed text-foreground/75">
          {description}
        </p>
      ) : null}
    </div>
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
          className="border-b border-border/50 py-16 sm:py-20"
          aria-labelledby="how-it-works-heading"
        >
          <div className="app-container space-y-12">
            <SectionHeading
              id="how-it-works-heading"
              title="How it works"
              description="Three steps from upload to guest-ready galleries."
            />
            <div className="grid gap-6 md:grid-cols-3">
              {steps.map((item, i) => (
                <ScrollReveal key={item.step} delayMs={i * 80}>
                  <article className="glass-panel marketing-card-lift flex h-full flex-col overflow-hidden">
                    <div className="relative aspect-[16/10] w-full border-b border-border/40">
                      <MarketingImage src={item.image} alt={item.alt} />
                    </div>
                    <CardHeader className="pb-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-[0_0_12px_hsl(var(--glow-primary)/0.5)]">
                        {item.step}
                      </span>
                      <CardTitle className="mt-3 font-display text-lg text-foreground">
                        {item.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 text-sm leading-relaxed text-foreground/75">
                      {item.description}
                    </CardContent>
                  </article>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border/50 py-16 sm:py-20">
          <div className="app-container grid gap-8 lg:grid-cols-2">
            <ScrollReveal>
              <article
                id="for-organizers"
                className="glass-panel-strong marketing-card-lift scroll-mt-28 overflow-hidden"
              >
                <div className="relative aspect-[21/9] border-b border-border/40">
                  <MarketingImage
                    src="/marketing/organizer-upload.jpg"
                    alt="Conference and event photography"
                  />
                </div>
                <CardHeader>
                  <CardTitle className="font-display text-xl text-foreground">
                    I&apos;m organizing an event
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2.5 text-sm leading-relaxed text-foreground/80">
                    <li className="flex gap-2">
                      <span className="font-bold text-primary">✓</span>
                      Create events and bulk-upload crowd photos
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-primary">✓</span>
                      Review AI-proposed tags by name and match score
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-primary">✓</span>
                      Control whether guests can download their shots
                    </li>
                  </ul>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button asChild>
                      <Link href="/admin">Start as organizer</Link>
                    </Button>
                    <Button variant="outline" asChild className="bg-card/50">
                      <Link href="/login">Sign in</Link>
                    </Button>
                  </div>
                </CardContent>
              </article>
            </ScrollReveal>
            <ScrollReveal delayMs={100}>
              <article
                id="for-attendees"
                className="glass-panel-strong marketing-card-lift scroll-mt-28 overflow-hidden ring-2 ring-primary/40 ring-offset-2 ring-offset-background"
              >
                <div className="relative aspect-[21/9] border-b border-border/40">
                  <MarketingImage
                    src="/marketing/guest-gallery.jpg"
                    alt="Friends looking at photos together"
                  />
                </div>
                <CardHeader>
                  <CardTitle className="font-display text-xl text-foreground">
                    I attended an event
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2.5 text-sm leading-relaxed text-foreground/80">
                    <li className="flex gap-2">
                      <span className="font-bold text-primary">✓</span>
                      Register with your event ID and up to five selfies
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-primary">✓</span>
                      Browse only photos you appear in—nothing else
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-primary">✓</span>
                      Flag wrong tags and download when the organizer allows
                    </li>
                  </ul>
                  <Button asChild className="mt-2 shadow-sm">
                    <Link href="/register">Register for an event</Link>
                  </Button>
                </CardContent>
              </article>
            </ScrollReveal>
          </div>
        </section>

        <section className="border-b border-border/50 py-16 sm:py-20">
          <div className="app-container space-y-12">
            <SectionHeading
              title="Quality you can stand behind"
              description="Automation where it helps. Human judgment where it matters."
            />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {trustItems.map((item, i) => (
                <ScrollReveal key={item.title} delayMs={i * 60}>
                  <div className="glass-panel marketing-card-lift flex h-full flex-col gap-3 p-5">
                    <IconBox>{item.icon}</IconBox>
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <p className="text-sm leading-relaxed text-foreground/75">
                      {item.description}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border/50 py-16 sm:py-20">
          <div className="app-container space-y-12">
            <SectionHeading
              title="Everything in one place"
              description="From upload to guest delivery—no spreadsheets, no manual face hunting."
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f, i) => (
                <ScrollReveal key={f.title} delayMs={i * 50}>
                  <div className="glass-panel marketing-card-lift h-full p-5">
                    <h3 className="font-semibold text-foreground">{f.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/75">
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
            <div className="glass-panel-strong mx-auto max-w-2xl divide-y divide-border/60 overflow-hidden">
              {faqs.map((item) => (
                <details key={item.q} className="group px-5 py-4">
                  <summary className="cursor-pointer list-none font-semibold text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center justify-between gap-4">
                      {item.q}
                      <span className="text-xl font-normal text-primary transition-transform group-open:rotate-45">
                        +
                      </span>
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-foreground/75">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border/40 py-14 sm:py-16">
          <div className="app-container">
            <div className="glass-panel-strong mx-auto max-w-3xl px-6 py-12 text-center sm:px-10">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Ready to deliver photos guests actually want?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-foreground/80">
                Set up your event in the admin dashboard, or register with the
                code from your organizer.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="min-w-[10rem] shadow-md">
                  <Link href="/register">Find my photos</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="min-w-[10rem] border-primary/40 bg-card/50"
                >
                  <Link href="/admin">For organizers</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50 py-8">
        <div className="app-container flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm font-medium text-foreground/70">
            © {new Date().getFullYear()} {PLATFORM_NAME}
          </p>
          <nav
            className="flex flex-wrap justify-center gap-4 text-sm font-medium"
            aria-label="Footer"
          >
            <Link href="/login" className="text-foreground/70 hover:text-foreground">
              Login
            </Link>
            <Link
              href="/register"
              className="text-foreground/70 hover:text-foreground"
            >
              Register
            </Link>
            <Link href="/admin" className="text-foreground/70 hover:text-foreground">
              Admin
            </Link>
            <Link href="/portal" className="text-foreground/70 hover:text-foreground">
              Portal
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
