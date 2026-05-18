import Link from "next/link";
import { QuickLinkCard } from "@/components/dashboard/quick-link-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { serverApiFetch } from "@/lib/server-api";
import type { EventDto, PhotoDto } from "@repo/types";
import { Button } from "@repo/ui/button";

export default async function AdminEventOverviewPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const [photosRes, eventRes] = await Promise.all([
    serverApiFetch(`/events/${eventId}/photos`),
    serverApiFetch(`/events/${eventId}/public`),
  ]);

  const photos = photosRes.ok
    ? ((await photosRes.json()) as { photos: PhotoDto[] }).photos
    : [];
  const event = eventRes.ok
    ? ((await eventRes.json()) as EventDto)
    : null;

  const proposed = photos.filter((p) => p.proposedUserIds.length > 0).length;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Photos" value={photos.length} />
        <StatCard
          label="With proposals"
          value={proposed}
          hint="Awaiting review"
        />
        <StatCard
          label="Downloads"
          value={event?.allowUserDownloads ? "On" : "Off"}
          hint="For attendees"
        />
        <StatCard
          label="Date"
          value={
            event?.date
              ? new Date(event.date).toLocaleDateString()
              : "—"
          }
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Event actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickLinkCard
            href={`/admin/events/${eventId}/photos`}
            title="Manage photos"
            description="Upload crowd shots and review AI-proposed tags."
          />
          <QuickLinkCard
            href={`/admin/events/${eventId}/organizers`}
            title="Organizers"
            description="Add team members who can upload and review photos."
          />
          <QuickLinkCard
            href={`/admin/events/${eventId}/settings`}
            title="Event settings"
            description="Downloads, reprocess matching, and preferences."
          />
          <div className="section-card flex flex-col justify-center gap-2 p-4">
            <p className="text-sm font-medium">Registration</p>
            <Button variant="outline" size="sm" asChild className="w-fit">
              <Link href={`/register?eventId=${eventId}`}>
                Open registration link
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
