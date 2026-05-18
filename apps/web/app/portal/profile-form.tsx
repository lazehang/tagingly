"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { publicApiBase } from "@/lib/api";
import { useSession } from "next-auth/react";
import type { UserSelfieDto } from "@repo/types";

const MAX_SELFIES = 5;

export function ProfileForm({
  initialName,
  initialSelfies,
}: {
  initialName: string;
  initialSelfies: UserSelfieDto[];
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [name, setName] = useState(initialName);
  const [selfies, setSelfies] = useState(initialSelfies);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const token = session?.accessToken ?? "";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    const fd = new FormData();
    fd.append("name", name);
    const res = await fetch(`${publicApiBase()}/users/me`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
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

  async function uploadSelfie(file: File) {
    if (selfies.length >= MAX_SELFIES) {
      setMsg(`Maximum ${MAX_SELFIES} selfies allowed.`);
      return;
    }
    setLoading(true);
    setMsg(null);
    const fd = new FormData();
    fd.append("selfie", file);
    const res = await fetch(`${publicApiBase()}/users/me/selfies`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    setLoading(false);
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      selfie?: UserSelfieDto;
    };
    if (!res.ok) {
      setMsg(data.error ?? "Upload failed.");
      return;
    }
    if (data.selfie) {
      setSelfies((s) => [...s, data.selfie!]);
    }
    router.refresh();
  }

  async function deleteSelfie(selfieId: string) {
    if (selfies.length <= 1) {
      setMsg("At least one selfie is required.");
      return;
    }
    if (!confirm("Remove this selfie?")) return;
    setLoading(true);
    setMsg(null);
    const res = await fetch(`${publicApiBase()}/users/me/selfies/${selfieId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setLoading(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setMsg(data.error ?? "Delete failed.");
      return;
    }
    setSelfies((s) => s.filter((x) => x.id !== selfieId));
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="section-card flex max-w-2xl flex-col gap-4 p-6"
    >
      <h2 className="text-sm font-medium">Profile</h2>

      <div className="space-y-2">
        <p className="form-label">
          Profile photos ({selfies.length}/{MAX_SELFIES})
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {selfies.map((s) => (
            <div
              key={s.id}
              className="relative overflow-hidden rounded-md border border-border bg-card/50"
            >
              {s.url ? (
                <div className="relative aspect-square w-full">
                  <Image
                    src={s.url}
                    alt="Profile"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : null}
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="absolute right-1 top-1 h-7 px-2 text-xs"
                disabled={loading || selfies.length <= 1}
                onClick={() => void deleteSelfie(s.id)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
        {selfies.length < MAX_SELFIES ? (
          <div>
            <Input
              type="file"
              accept="image/*"
              disabled={loading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadSelfie(f);
                e.target.value = "";
              }}
            />
            <p className="form-hint mt-1">
              Add another clear selfie to improve matching.
            </p>
          </div>
        ) : null}
      </div>

      <div className="space-y-1">
        <label className="form-label" htmlFor="name-pr">
          Name
        </label>
        <Input
          id="name-pr"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={loading} size="sm">
        {loading ? "Saving…" : "Save name"}
      </Button>
      {msg ? <p className="text-sm text-destructive">{msg}</p> : null}
    </form>
  );
}
