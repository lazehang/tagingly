import { serverApiFetch } from "@/lib/server-api";
import { EventPhotoUpload } from "../event-upload";
import { PhotoCardWithReview } from "../photo-review-modal";
import type { PhotoDto } from "@repo/types";

export default async function AdminEventPhotosPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const photosRes = await serverApiFetch(`/events/${eventId}/photos`);

  if (!photosRes.ok) {
    return <p className="text-destructive">Could not load photos.</p>;
  }
  const { photos } = (await photosRes.json()) as { photos: PhotoDto[] };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Photos</h2>
        <p className="text-sm text-muted-foreground">
          Upload event images and review AI-proposed tags before guests see them.
        </p>
      </div>

      <EventPhotoUpload eventId={eventId} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((p) => (
          <PhotoCardWithReview key={p.id} eventId={eventId} photo={p} />
        ))}
      </div>
      {photos.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No photos yet. Upload images above to start processing.
        </p>
      ) : null}
    </div>
  );
}
