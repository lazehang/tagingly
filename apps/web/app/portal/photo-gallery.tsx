"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { PhotoDto } from "@repo/types";
import { PhotoLightbox } from "./photo-lightbox";

export function PhotoGallery({
  photos: initialPhotos,
  allowUserDownloads,
}: {
  photos: PhotoDto[];
  allowUserDownloads: boolean;
}) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    setPhotos(initialPhotos);
  }, [initialPhotos]);

  if (photos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No tagged photos yet. After organizers upload event photos and processing
        finishes, matches appear here.
      </p>
    );
  }

  return (
    <>
      <p className="text-sm text-muted-foreground">
        {photos.length} photo{photos.length === 1 ? "" : "s"}. Click any image to
        view full size and navigate.
      </p>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((photo, index) => (
          <li key={photo.id}>
            <button
              type="button"
              onClick={() => setLightboxIndex(index)}
              className="group relative aspect-square w-full overflow-hidden rounded-lg border border-border bg-card/50 transition hover:border-primary/50 hover:shadow-[0_0_20px_-8px_hsl(var(--glow-primary)/0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {photo.photoUrl ? (
                <Image
                  src={photo.photoUrl}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition duration-200 group-hover:scale-[1.02]"
                  unoptimized
                />
              ) : (
                <span className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  No preview
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      {lightboxIndex !== null ? (
        <PhotoLightbox
          photos={photos}
          initialIndex={lightboxIndex}
          allowUserDownloads={allowUserDownloads}
          onClose={() => setLightboxIndex(null)}
          onPhotosChange={setPhotos}
        />
      ) : null}
    </>
  );
}
