import { serverApiFetch } from "@/lib/server-api";
import { EventSettings } from "../event-settings";
import { ReprocessAllButton } from "../reprocess";
import type { EventDto } from "@repo/types";

export default async function AdminEventSettingsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const eventRes = await serverApiFetch(`/events/${eventId}/public`);
  const event = eventRes.ok
    ? ((await eventRes.json()) as EventDto)
    : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Control attendee downloads and re-run face matching for this event.
        </p>
      </div>

      <EventSettings
        eventId={eventId}
        initialAllowUserDownloads={event?.allowUserDownloads ?? false}
      />

      <section className="section-card space-y-3 p-4">
        <h3 className="text-sm font-medium">Reprocess matching</h3>
        <p className="text-sm text-muted-foreground">
          Re-scan uploaded photos for new proposals. Confirmed tags and exclusions
          are preserved.
        </p>
        <ReprocessAllButton eventId={eventId} />
      </section>
    </div>
  );
}
