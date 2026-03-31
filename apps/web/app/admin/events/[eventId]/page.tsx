import Image from "next/image";
import Link from "next/link";
import { serverApiFetch } from "@/lib/server-api";
import { EventPhotoUpload } from "./event-upload";
import type { PhotoDto } from "@repo/types";
import { Card, CardContent } from "@repo/ui/card";
import { Button } from "@repo/ui/button";

export default async function AdminEventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const res = await serverApiFetch(`/events/${eventId}/photos`);
  if (!res.ok) {
    return <p className="text-destructive">Could not load photos.</p>;
  }
  const { photos } = (await res.json()) as { photos: PhotoDto[] };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin">← Back</Link>
          </Button>
          <h1 className="mt-2 text-2xl font-semibold">Event photos</h1>
          <p className="font-mono text-xs text-muted-foreground">{eventId}</p>
        </div>
      </div>
      <EventPhotoUpload eventId={eventId} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((p) => (
          <Card key={p.id} className="overflow-hidden">
            {p.photoUrl ? (
              <div className="relative aspect-[4/3] w-full bg-muted">
                <Image
                  src={p.photoUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  unoptimized
                />
              </div>
            ) : null}
            <CardContent className="p-3 text-xs">
              <p>
                Status: <strong>{p.status}</strong>
              </p>
              <p className="mt-1 text-muted-foreground">
                Tagged attendees: {p.taggedUserIds.length}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      {photos.length === 0 ? (
        <p className="text-sm text-muted-foreground">No photos yet.</p>
      ) : null}
    </div>
  );
}
