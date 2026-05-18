import { serverApiFetch } from "@/lib/server-api";
import { auth } from "@/lib/auth";
import { isSuperadmin } from "@/lib/roles";
import { EventOrganizersPanel } from "../event-organizers";
import type { EventOrganizerDto } from "@repo/types";

export default async function EventOrganizersPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const session = await auth();
  const res = await serverApiFetch(`/events/${eventId}/organizers`);

  if (!res.ok) {
    return <p className="text-destructive">Could not load organizers.</p>;
  }

  const { organizers } = (await res.json()) as {
    organizers: EventOrganizerDto[];
  };

  const myId = session?.user?.id;
  const myRow = organizers.find((o) => o.userId === myId);
  const canManage =
    isSuperadmin(session?.user?.role) || myRow?.role === "OWNER";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Organizers</h2>
        <p className="text-sm text-muted-foreground">
          People who can upload photos and review AI tags for this event.
        </p>
      </div>
      <EventOrganizersPanel
        eventId={eventId}
        initialOrganizers={organizers}
        canManage={canManage}
      />
    </div>
  );
}
