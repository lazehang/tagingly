import Link from "next/link";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { Button } from "@repo/ui/button";

export default function EventNotFound() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <main className="app-container flex min-h-[60vh] flex-col items-center justify-center gap-4 py-16 text-center">
        <h1 className="font-display text-2xl font-semibold">Event not found</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          This registration link may be outdated or incorrect. Ask your organizer
          for a new invite link.
        </p>
        <Button asChild variant="outline">
          <Link href="/">Back to home</Link>
        </Button>
      </main>
    </div>
  );
}
