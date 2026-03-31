"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { publicApiBase } from "@/lib/api";
import { useSession } from "next-auth/react";

export function EventPhotoUpload({ eventId }: { eventId: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const input = document.getElementById("photos") as HTMLInputElement;
    const files = input?.files;
    if (!files?.length) {
      setMsg("Choose one or more images.");
      return;
    }
    const fd = new FormData();
    for (const f of Array.from(files)) {
      fd.append("photos", f);
    }
    setLoading(true);
    const res = await fetch(`${publicApiBase()}/events/${eventId}/photos`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session?.accessToken ?? ""}` },
      body: fd,
    });
    setLoading(false);
    if (!res.ok) {
      setMsg("Upload failed.");
      return;
    }
    input.value = "";
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-sm"
    >
      <h2 className="text-sm font-medium">Upload event photos</h2>
      <Input id="photos" type="file" accept="image/*" multiple required />
      <Button type="submit" disabled={loading}>
        {loading ? "Uploading…" : "Upload"}
      </Button>
      {msg ? <p className="text-sm text-destructive">{msg}</p> : null}
    </form>
  );
}
