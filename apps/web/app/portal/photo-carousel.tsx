"use client";

import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@repo/ui/button";
import { publicApiBase } from "@/lib/api";
import { downloadAuthenticatedFile } from "@/lib/download";
import type { PhotoDto } from "@repo/types";

export function PhotoCarousel({
  photos: initialPhotos,
  allowUserDownloads,
}: {
  photos: PhotoDto[];
  allowUserDownloads: boolean;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [photos, setPhotos] = useState(initialPhotos);
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setPhotos(initialPhotos);
    setIndex((i) => Math.min(i, Math.max(0, initialPhotos.length - 1)));
  }, [initialPhotos]);

  const photo = photos[index];
  const token = session?.accessToken ?? "";

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => {
        if (photos.length === 0) return 0;
        return (i + delta + photos.length) % photos.length;
      });
      setMsg(null);
    },
    [photos.length]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  async function removeTag() {
    if (!photo) return;
    if (
      !confirm(
        "Remove this photo from your gallery? This helps improve future matching."
      )
    ) {
      return;
    }
    setBusy(true);
    setMsg(null);
    const res = await fetch(
      `${publicApiBase()}/users/me/photos/${photo.id}/tag`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    setBusy(false);
    if (!res.ok) {
      setMsg("Could not remove tag.");
      return;
    }
    const next = photos.filter((p) => p.id !== photo.id);
    setPhotos(next);
    setIndex((i) => Math.min(i, Math.max(0, next.length - 1)));
    router.refresh();
  }

  async function downloadPhoto() {
    if (!photo) return;
    setBusy(true);
    setMsg(null);
    try {
      await downloadAuthenticatedFile(
        `${publicApiBase()}/users/me/photos/${photo.id}/download`,
        token,
        `photo-${photo.id}.jpg`
      );
    } catch {
      setMsg("Download is not available.");
    } finally {
      setBusy(false);
    }
  }

  if (photos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No tagged photos yet. After organizers upload event photos and processing
        finishes, matches appear here.
      </p>
    );
  }

  if (!photo) return null;

  return (
    <div className="space-y-4">
      <div className="section-card relative overflow-hidden">
        {photo.photoUrl ? (
          <div className="relative aspect-[4/3] w-full bg-card/50">
            <Image
              src={photo.photoUrl}
              alt=""
              fill
              className="object-contain"
              priority
              unoptimized
            />
          </div>
        ) : null}
        <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-between px-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="opacity-90"
            onClick={() => go(-1)}
            aria-label="Previous photo"
          >
            ←
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="opacity-90"
            onClick={() => go(1)}
            aria-label="Next photo"
          >
            →
          </Button>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        {index + 1} of {photos.length}
      </p>

      <div className="flex flex-wrap justify-center gap-2">
        {allowUserDownloads ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => void downloadPhoto()}
          >
            Download
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => void removeTag()}
        >
          Not me in this photo
        </Button>
      </div>

      {msg ? <p className="text-center text-sm text-destructive">{msg}</p> : null}

      {photos.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setIndex(i);
                setMsg(null);
              }}
              className={`relative h-14 w-20 shrink-0 overflow-hidden rounded border ${
                i === index ? "ring-2 ring-primary" : ""
              }`}
            >
              {p.photoUrl ? (
                <Image
                  src={p.photoUrl}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
