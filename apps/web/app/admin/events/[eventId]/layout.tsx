import Link from "next/link";
import { DashboardSubNav } from "@/components/dashboard/dashboard-nav";
import { serverApiFetch } from "@/lib/server-api";
import { eventSubNavItems } from "@/lib/dashboard-nav";
import type { EventDto } from "@repo/types";
import { Button } from "@repo/ui/button";

export default async function AdminEventLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const eventRes = await serverApiFetch(`/events/${eventId}/public`);
  const event = eventRes.ok
    ? ((await eventRes.json()) as EventDto)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Event
          </p>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {event?.name ?? "Event"}
          </h1>
          <p className="font-mono text-xs text-muted-foreground">{eventId}</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/events">← All events</Link>
        </Button>
      </div>

      <DashboardSubNav items={eventSubNavItems(eventId)} />

      {children}
    </div>
  );
}
