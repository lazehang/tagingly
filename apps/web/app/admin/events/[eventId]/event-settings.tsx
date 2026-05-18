"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@repo/ui/button";
import { publicApiBase } from "@/lib/api";

export function EventSettings({
  eventId,
  initialAllowUserDownloads,
}: {
  eventId: string;
  initialAllowUserDownloads: boolean;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialAllowUserDownloads);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSave() {
    setLoading(true);
    setMsg(null);
    const res = await fetch(`${publicApiBase()}/events/${eventId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${session?.accessToken ?? ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ allowUserDownloads: enabled }),
    });
    setLoading(false);
    if (!res.ok) {
      setMsg("Could not save settings.");
      return;
    }
    setMsg("Saved.");
    router.refresh();
  }

  return (
    <section className="section-card p-4">
      <h2 className="text-sm font-medium">Event settings</h2>
      <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="size-4 rounded border"
        />
        Allow users to download their tagged photos
      </label>
      <div className="mt-3 flex items-center gap-2">
        <Button type="button" size="sm" disabled={loading} onClick={onSave}>
          {loading ? "Saving…" : "Save settings"}
        </Button>
        {msg ? (
          <span className="text-xs text-muted-foreground">{msg}</span>
        ) : null}
      </div>
    </section>
  );
}
