"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { publicApiBase } from "@/lib/api";
import { useSession } from "next-auth/react";

export function AdminCreateEventForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    const res = await fetch(`${publicApiBase()}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.accessToken ?? ""}`,
      },
      body: JSON.stringify({
        name,
        date: new Date(date).toISOString(),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      setMsg("Could not create event.");
      return;
    }
    setName("");
    setDate("");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex max-w-xl flex-col gap-3 rounded-lg border bg-card p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end"
    >
      <div className="min-w-[200px] flex-1 space-y-1">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="ev-name">
          Name
        </label>
        <Input
          id="ev-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Conference 2026"
        />
      </div>
      <div className="min-w-[200px] flex-1 space-y-1">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="ev-date">
          Date
        </label>
        <Input
          id="ev-date"
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Saving…" : "Create event"}
      </Button>
      {msg ? <p className="w-full text-sm text-destructive">{msg}</p> : null}
    </form>
  );
}
