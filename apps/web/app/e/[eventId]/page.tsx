import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { EventRegistrationForm } from "@/components/event/event-registration-form";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { PLATFORM_NAME } from "@/lib/brand";
import { publicApiBase } from "@/lib/api";
import type { EventDto } from "@repo/types";
import { Button } from "@repo/ui/button";

async function fetchPublicEvent(eventId: string): Promise<EventDto | null> {
  const res = await fetch(`${publicApiBase()}/events/${eventId}/public`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return null;
  return (await res.json()) as EventDto;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventId: string }>;
}): Promise<Metadata> {
  const { eventId } = await params;
  const event = await fetchPublicEvent(eventId);
  if (!event) {
    return { title: `Event not found · ${PLATFORM_NAME}` };
  }
  return {
    title: `${event.name} · Register · ${PLATFORM_NAME}`,
    description: `Register for ${event.name} and get your personal photo gallery when event photos are ready.`,
  };
}

export default async function EventLandingPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const event = await fetchPublicEvent(eventId);
  if (!event) notFound();

  const eventDate = new Date(event.date);
  const dateLabel = eventDate.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <main className="marketing-mesh relative">
        <div className="app-container py-10 md:py-16">
          <div className="mx-auto max-w-3xl space-y-10">
            <header className="space-y-4 text-center">
              <p className="text-xs font-medium uppercase tracking-widest text-primary">
                Event registration
              </p>
              <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
                {event.name}
              </h1>
              <p className="text-lg text-muted-foreground">{dateLabel}</p>
              <p className="mx-auto max-w-xl text-sm text-muted-foreground">
                Sign up with a few clear selfies. When organizers upload photos,{" "}
                {PLATFORM_NAME} finds pictures of you and builds a private gallery
                you can browse from your account.
              </p>
              <Button asChild size="lg" className="mt-2">
                <Link href="#register">Register now</Link>
              </Button>
            </header>

            <section className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  title: "Upload selfies",
                  body: "Add 1–5 photos of your face in good lighting.",
                },
                {
                  title: "We match you",
                  body: "AI proposes tags; organizers review before photos go live.",
                },
                {
                  title: "View your gallery",
                  body: "See only the shots you appear in — not the full album.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="glass-panel p-4 text-center"
                >
                  <h2 className="text-sm font-semibold">{item.title}</h2>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {item.body}
                  </p>
                </div>
              ))}
            </section>

            <section
              id="register"
              className="glass-panel-strong scroll-mt-24 p-6 md:p-8"
            >
              <EventRegistrationForm
                eventId={eventId}
                event={event}
                embedded
              />
            </section>

            <p className="text-center text-xs text-muted-foreground">
              Already registered?{" "}
              <Link href="/login" className="text-primary underline-offset-4 hover:underline">
                Sign in to your gallery
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
