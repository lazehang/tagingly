"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@repo/ui/button";
import { publicApiBase } from "@/lib/api";

export function ReprocessPhotoButton({
  eventId,
  photoId,
}: {
  eventId: string;
  photoId: string;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    await fetch(
      `${publicApiBase()}/events/${eventId}/photos/${photoId}/reprocess`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.accessToken ?? ""}` },
      }
    );
    setLoading(false);
    router.refresh();
  }

  return (
    <Button type="button" size="sm" variant="outline" disabled={loading} onClick={onClick}>
      {loading ? "Reprocessing…" : "Reprocess"}
    </Button>
  );
}

export function ReprocessAllButton({ eventId }: { eventId: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    if (!confirm("Reprocess all photos for this event?")) return;
    setLoading(true);
    await fetch(`${publicApiBase()}/events/${eventId}/photos/reprocess`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session?.accessToken ?? ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <Button type="button" size="sm" variant="secondary" disabled={loading} onClick={onClick}>
      {loading ? "Reprocessing…" : "Reprocess all"}
    </Button>
  );
}

