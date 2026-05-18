import Link from "next/link";
import { PageHeader } from "@/components/app-shell";
import { QuickLinkCard } from "@/components/dashboard/quick-link-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@repo/ui/button";
import { serverApiFetch } from "@/lib/server-api";
import type { UserPhotosResponse, UserPublicDto } from "@repo/types";

export default async function PortalOverviewPage() {
  const meRes = await serverApiFetch("/auth/me");
  if (!meRes.ok) {
    return <p className="text-destructive">Could not load profile.</p>;
  }
  const meData = (await meRes.json()) as {
    user: UserPublicDto;
    event?: { allowUserDownloads: boolean };
  };
  const { user, event } = meData;

  const phRes = await serverApiFetch("/users/me/photos");
  const photosPayload = phRes.ok
    ? ((await phRes.json()) as UserPhotosResponse)
    : { photos: [], allowUserDownloads: false };

  const photoCount = photosPayload.photos.length;
  const selfieCount = user.selfies?.length ?? 0;
  const allowDownload =
    photosPayload.allowUserDownloads ?? event?.allowUserDownloads ?? false;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Overview"
        description={
          user.eventId
            ? `${user.name} · ${user.email} · Event ${user.eventId}`
            : `${user.name} · ${user.email}`
        }
        actions={
          <Button asChild size="sm">
            <Link href="/portal/gallery">Open gallery</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tagged photos" value={photoCount} hint="In your gallery" />
        <StatCard
          label="Profile selfies"
          value={`${selfieCount}/5`}
          hint="Used for AI matching"
        />
        <StatCard
          label="Downloads"
          value={allowDownload ? "Enabled" : "Disabled"}
          hint="Set by your organizer"
        />
        <StatCard
          label="Event"
          value={user.eventId ? "Joined" : "—"}
          hint={user.eventId ?? "No event linked"}
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Quick actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickLinkCard
            href="/portal/gallery"
            title="Browse gallery"
            description="View photos you appear in and flag incorrect tags."
          />
          <QuickLinkCard
            href="/portal/profile"
            title="Manage profile"
            description="Update your name and reference selfies for matching."
          />
          {allowDownload ? (
            <QuickLinkCard
              href="/portal/gallery"
              title="Download photos"
              description="Save originals from your gallery when enabled."
            />
          ) : (
            <div className="section-card p-4 opacity-80">
              <h3 className="font-semibold text-muted-foreground">Downloads</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Your organizer has not enabled photo downloads for this event.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
