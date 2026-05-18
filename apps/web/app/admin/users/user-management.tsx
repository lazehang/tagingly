"use client";

import { useCallback, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { publicApiBase } from "@/lib/api";
import type { EventDto, UserPublicDto, UserRole } from "@repo/types";

const ROLES: UserRole[] = ["USER", "ORGANIZER", "SUPERADMIN"];

export function UserManagement({
  initialUsers,
  initialEvents,
}: {
  initialUsers: UserPublicDto[];
  initialEvents: EventDto[];
}) {
  const { data: session } = useSession();
  const token = session?.accessToken ?? "";
  const [users, setUsers] = useState(initialUsers);
  const [events] = useState(initialEvents);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [assignUserId, setAssignUserId] = useState("");
  const [assignEventId, setAssignEventId] = useState("");

  const refreshUsers = useCallback(async () => {
    const res = await fetch(`${publicApiBase()}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = (await res.json()) as { users: UserPublicDto[] };
      setUsers(data.users);
    }
  }, [token]);

  async function updateRole(userId: string, role: UserRole) {
    setBusy(true);
    setMsg(null);
    const res = await fetch(`${publicApiBase()}/admin/users/${userId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role }),
    });
    setBusy(false);
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setMsg(data.error ?? "Could not update role.");
      return;
    }
    setMsg("Role updated.");
    await refreshUsers();
  }

  async function assignToEvent() {
    if (!assignUserId || !assignEventId) {
      setMsg("Select a user and event.");
      return;
    }
    setBusy(true);
    setMsg(null);
    const res = await fetch(
      `${publicApiBase()}/admin/users/${assignUserId}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ eventId: assignEventId, role: "ORGANIZER" }),
      }
    );
    setBusy(false);
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setMsg(data.error ?? "Could not assign event access.");
      return;
    }
    setMsg("User granted access to event.");
    setAssignUserId("");
    setAssignEventId("");
  }

  return (
    <div className="space-y-8">
      <section className="section-card space-y-4 p-4">
        <h2 className="text-sm font-semibold">Assign user to event</h2>
        <p className="text-sm text-muted-foreground">
          Grant an organizer or superadmin access to upload and review photos for
          an event.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="form-label" htmlFor="assign-user">
              User
            </label>
            <select
              id="assign-user"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={assignUserId}
              onChange={(e) => setAssignUserId(e.target.value)}
            >
              <option value="">Select user…</option>
              {users
                .filter((u) => u.role !== "USER")
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email}) — {u.role}
                  </option>
                ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="form-label" htmlFor="assign-event">
              Event
            </label>
            <select
              id="assign-event"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={assignEventId}
              onChange={(e) => setAssignEventId(e.target.value)}
            >
              <option value="">Select event…</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Button type="button" disabled={busy} onClick={() => void assignToEvent()}>
          Grant event access
        </Button>
      </section>

      <section className="section-card overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">All users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-card/60 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border/60">
                  <td className="px-4 py-3">{u.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <select
                      className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                      value={u.role}
                      disabled={busy}
                      onChange={(e) =>
                        void updateRole(u.id, e.target.value as UserRole)
                      }
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
    </div>
  );
}
