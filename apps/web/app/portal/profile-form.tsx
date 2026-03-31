"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { publicApiBase } from "@/lib/api";
import { useSession } from "next-auth/react";

export function ProfileForm({
  initialName,
}: {
  initialName: string;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [name, setName] = useState(initialName);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    const fd = new FormData();
    fd.append("name", name);
    const selfieInput = (document.getElementById("selfie-replace") as HTMLInputElement)
      ?.files?.[0];
    if (selfieInput) {
      fd.append("selfie", selfieInput);
    }
    const res = await fetch(`${publicApiBase()}/users/me`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${session?.accessToken ?? ""}` },
      body: fd,
    });
    setLoading(false);
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setMsg(data.error ?? "Update failed.");
      return;
    }
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex max-w-xl flex-col gap-3 rounded-lg border bg-card p-4 shadow-sm"
    >
      <h2 className="text-sm font-medium">Profile</h2>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground" htmlFor="name-pr">
          Name
        </label>
        <Input
          id="name-pr"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground" htmlFor="selfie-replace">
          Replace selfie (optional)
        </label>
        <Input id="selfie-replace" type="file" accept="image/*" />
      </div>
      <Button type="submit" disabled={loading} size="sm">
        {loading ? "Saving…" : "Save"}
      </Button>
      {msg ? <p className="text-sm text-destructive">{msg}</p> : null}
    </form>
  );
}
