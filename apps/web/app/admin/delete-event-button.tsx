"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@repo/ui/button";
import { publicApiBase } from "@/lib/api";
import { useSession } from "next-auth/react";

export function DeleteEventButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    if (!confirm("Delete this event and related data?")) return;
    setLoading(true);
    await fetch(`${publicApiBase()}/events/${eventId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session?.accessToken ?? ""}` },
    });
    setLoading(false);
    router.push("/admin");
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      disabled={loading}
      onClick={onClick}
    >
      Delete
    </Button>
  );
}
