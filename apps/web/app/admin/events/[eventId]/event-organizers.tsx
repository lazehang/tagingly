"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { publicApiBase } from "@/lib/api";
import type { EventOrganizerDto } from "@repo/types";

export function EventOrganizersPanel({
  eventId,
  initialOrganizers,
  canManage,
}: {
  eventId: string;
  initialOrganizers: EventOrganizerDto[];
  canManage: boolean;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const token = session?.accessToken ?? "";
  const [organizers, setOrganizers] = useState(initialOrganizers);
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function addOrganizer(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setMsg(null);
    const res = await fetch(`${publicApiBase()}/events/${eventId}/organizers`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email.trim() }),
    });
    setLoading(false);
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      organizer?: EventOrganizerDto;
    };
    if (!res.ok) {
      setMsg(data.error ?? "Could not add organizer.");
      return;
    }
    if (data.organizer) {
      setOrganizers((rows) => [...rows, data.organizer!]);
    }
    setEmail("");
    setMsg("Organizer added.");
    router.refresh();
  }

  async function removeOrganizer(userId: string) {
    if (!confirm("Remove this organizer from the event?")) return;
    setLoading(true);
    setMsg(null);
    const res = await fetch(
      `${publicApiBase()}/events/${eventId}/organizers/${userId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    setLoading(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setMsg(data.error ?? "Could not remove organizer.");
      return;
    }
    setOrganizers((rows) => rows.filter((r) => r.userId !== userId));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {canManage ? (
        <form onSubmit={addOrganizer} className="section-card flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
          <div className="min-w-[240px] flex-1 space-y-1">
            <label className="form-label" htmlFor="org-email">
              Add organizer by email
            </label>
            <Input
              id="org-email"
              type="email"
              placeholder="organizer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <p className="form-hint">
              User must already have the Organizer role (set by a superadmin).
            </p>
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Adding…" : "Add organizer"}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          Only event owners can add or remove organizers.
        </p>
      )}

      <div className="section-card overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Event team</h2>
        </div>
        <ul className="divide-y divide-border/60">
          {organizers.map((o) => (
            <li
              key={o.id}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
            >
              <div>
                <p className="font-medium">{o.name}</p>
                <p className="text-sm text-muted-foreground">{o.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                  {o.role}
                </span>
                {canManage && o.role !== "OWNER" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={loading}
                    onClick={() => void removeOrganizer(o.userId)}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
          {organizers.length === 0 ? (
            <li className="px-4 py-6 text-sm text-muted-foreground">
              No organizers yet.
            </li>
          ) : null}
        </ul>
      </div>

      {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
    </div>
  );
}
