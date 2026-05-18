"use client";

import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Card, CardContent } from "@repo/ui/card";
import { Modal, ModalDescription, ModalTitle } from "@repo/ui/modal";
import { publicApiBase } from "@/lib/api";
import type {
  EventUserSearchResult,
  PhotoDetailDto,
  PhotoDto,
  TaggedUserDto,
  UserSelfieDto,
} from "@repo/types";

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function UserSelfieStrip({ selfies }: { selfies: UserSelfieDto[] }) {
  if (!selfies.length) {
    return (
      <p className="text-xs text-muted-foreground">No reference selfies on file.</p>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {selfies.map((s) => (
        <div
          key={s.id}
          className="relative h-16 w-16 overflow-hidden rounded-md border border-border bg-card/60"
          title="Reference selfie"
        >
          {s.url ? (
            <Image
              src={s.url}
              alt=""
              fill
              className="object-cover"
              unoptimized
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function TagRow({
  tag,
  onConfirm,
  onReject,
  onRemove,
  busy,
}: {
  tag: TaggedUserDto;
  onConfirm?: () => void;
  onReject?: () => void;
  onRemove?: () => void;
  busy: boolean;
}) {
  const pct =
    tag.certainty !== undefined
      ? `${Math.round(tag.certainty * 100)}% match`
      : null;
  const selfies = tag.selfies ?? [];
  return (
    <li className="space-y-2 rounded-md border border-border bg-card/40 px-3 py-2 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{tag.name}</p>
          <p className="truncate text-xs text-muted-foreground">{tag.email}</p>
          {pct ? (
            <p className="text-xs text-muted-foreground">{pct}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-1">
          {tag.tagKind === "proposed" && onConfirm ? (
            <Button type="button" size="sm" disabled={busy} onClick={onConfirm}>
              Confirm
            </Button>
          ) : null}
          {tag.tagKind === "proposed" && onReject ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={onReject}
            >
              Reject
            </Button>
          ) : null}
          {tag.tagKind === "confirmed" && onRemove ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={onRemove}
            >
              Remove
            </Button>
          ) : null}
        </div>
      </div>
      <div>
        <p className="mb-1 text-xs font-medium text-muted-foreground">
          Reference selfies
        </p>
        <UserSelfieStrip selfies={selfies} />
      </div>
    </li>
  );
}

export function PhotoReviewModal({
  eventId,
  photo,
  open,
  onOpenChange,
  onDeleted,
}: {
  eventId: string;
  photo: PhotoDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const token = session?.accessToken ?? "";
  const [detail, setDetail] = useState<PhotoDetailDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<EventUserSearchResult[]>(
    []
  );
  const [error, setError] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    const res = await fetch(
      `${publicApiBase()}/events/${eventId}/photos/${photo.id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setLoading(false);
    if (!res.ok) {
      setError("Could not load photo details.");
      return;
    }
    const data = (await res.json()) as { photo: PhotoDetailDto };
    setDetail(data.photo);
  }, [eventId, photo.id, token]);

  useEffect(() => {
    if (open) void loadDetail();
  }, [open, loadDetail]);

  useEffect(() => {
    if (!open || searchQ.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(() => {
      void (async () => {
        const res = await fetch(
          `${publicApiBase()}/events/${eventId}/users/search?q=${encodeURIComponent(searchQ.trim())}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) return;
        const data = (await res.json()) as { users: EventUserSearchResult[] };
        setSearchResults(data.users);
      })();
    }, 300);
    return () => clearTimeout(t);
  }, [searchQ, eventId, token, open]);

  async function runAction(fn: () => Promise<Response>) {
    setBusy(true);
    setError(null);
    const res = await fn();
    setBusy(false);
    if (!res.ok) {
      setError("Action failed.");
      return;
    }
    await loadDetail();
    router.refresh();
  }

  async function deletePhoto() {
    if (
      !confirm(
        "Delete this event photo permanently? This cannot be undone."
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch(
      `${publicApiBase()}/events/${eventId}/photos/${photo.id}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
    );
    setBusy(false);
    if (!res.ok) {
      setError("Could not delete photo.");
      return;
    }
    onOpenChange(false);
    onDeleted?.();
    router.refresh();
  }

  const proposed =
    detail?.taggedUsers.filter((t) => t.tagKind === "proposed") ?? [];
  const confirmed =
    detail?.taggedUsers.filter((t) => t.tagKind === "confirmed") ?? [];
  const imageUrl = detail?.photoUrl ?? photo.photoUrl;

  return (
    <Modal open={open} onOpenChange={onOpenChange} contentClassName="max-w-3xl">
      <ModalTitle>Review photo</ModalTitle>
      <ModalDescription className="mb-4">
        High-confidence matches are auto-confirmed; others appear here as
        proposed. Compare to reference selfies before approving. Rejected tags
        are remembered so reprocessing will not suggest them again.
      </ModalDescription>

      {imageUrl ? (
        <div className="relative mb-4 aspect-[4/3] w-full overflow-hidden rounded-md bg-card/50">
          <Image
            src={imageUrl}
            alt=""
            fill
            className="object-contain"
            unoptimized
          />
        </div>
      ) : null}

      <p className="mb-4 text-xs text-muted-foreground">
        Status: <strong>{detail?.status ?? photo.status}</strong>
        {loading ? " · Loading tags…" : null}
      </p>

      {error ? <p className="mb-2 text-sm text-destructive">{error}</p> : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <section>
          <h3 className="mb-2 text-sm font-medium">
            Proposed ({proposed.length})
          </h3>
          {proposed.length === 0 ? (
            <p className="text-xs text-muted-foreground">No proposed tags.</p>
          ) : (
            <ul className="space-y-2">
              {proposed.map((tag) => (
                <TagRow
                  key={`p-${tag.id}`}
                  tag={tag}
                  busy={busy}
                  onConfirm={() =>
                    runAction(() =>
                      fetch(
                        `${publicApiBase()}/events/${eventId}/photos/${photo.id}/proposed/${tag.id}/confirm`,
                        { method: "POST", headers: authHeaders(token) }
                      )
                    )
                  }
                  onReject={() =>
                    runAction(() =>
                      fetch(
                        `${publicApiBase()}/events/${eventId}/photos/${photo.id}/proposed/${tag.id}/reject`,
                        { method: "POST", headers: authHeaders(token) }
                      )
                    )
                  }
                />
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3 className="mb-2 text-sm font-medium">
            Confirmed ({confirmed.length})
          </h3>
          {confirmed.length === 0 ? (
            <p className="text-xs text-muted-foreground">No confirmed tags yet.</p>
          ) : (
            <ul className="space-y-2">
              {confirmed.map((tag) => (
                <TagRow
                  key={`c-${tag.id}`}
                  tag={tag}
                  busy={busy}
                  onRemove={() =>
                    runAction(() =>
                      fetch(
                        `${publicApiBase()}/events/${eventId}/photos/${photo.id}/confirmed/remove`,
                        {
                          method: "POST",
                          headers: authHeaders(token),
                          body: JSON.stringify({ userId: tag.id }),
                        }
                      )
                    )
                  }
                />
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-6 border-t pt-4">
        <h3 className="mb-2 text-sm font-medium">Add person manually</h3>
        <Input
          placeholder="Search by name or email…"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
        />
        {searchResults.length > 0 ? (
          <ul className="mt-2 max-h-56 overflow-y-auto rounded-md border">
            {searchResults.map((u) => (
              <li key={u.id} className="border-b border-border/60 last:border-0">
                <button
                  type="button"
                  className="flex w-full flex-col gap-2 px-3 py-2 text-left text-sm hover:bg-card/60"
                  disabled={busy}
                  onClick={() =>
                    runAction(() =>
                      fetch(
                        `${publicApiBase()}/events/${eventId}/photos/${photo.id}/confirmed/add`,
                        {
                          method: "POST",
                          headers: authHeaders(token),
                          body: JSON.stringify({ userId: u.id }),
                        }
                      ).then((res) => {
                        if (res.ok) {
                          setSearchQ("");
                          setSearchResults([]);
                        }
                        return res;
                      })
                    )
                  }
                >
                  <span className="flex w-full items-center justify-between">
                    <span>
                      {u.name} · {u.email}
                    </span>
                    <span className="text-xs text-primary">Add</span>
                  </span>
                  {u.selfies?.length ? (
                    <UserSelfieStrip selfies={u.selfies} />
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        ) : searchQ.trim().length >= 2 ? (
          <p className="mt-1 text-xs text-muted-foreground">No users found.</p>
        ) : null}
      </section>

      <div className="mt-6 flex flex-wrap gap-2 border-t pt-4">
        <Button
          type="button"
          size="sm"
          disabled={busy || proposed.length === 0}
          onClick={() =>
            runAction(() =>
              fetch(
                `${publicApiBase()}/events/${eventId}/photos/${photo.id}/confirm`,
                { method: "POST", headers: authHeaders(token), body: "{}" }
              )
            )
          }
        >
          Approve all proposed
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() =>
            runAction(() =>
              fetch(
                `${publicApiBase()}/events/${eventId}/photos/${photo.id}/reprocess`,
                { method: "POST", headers: { Authorization: `Bearer ${token}` } }
              )
            )
          }
        >
          Reprocess
        </Button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          disabled={busy}
          onClick={() => void deletePhoto()}
        >
          Delete photo
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => onOpenChange(false)}
        >
          Close
        </Button>
      </div>
    </Modal>
  );
}

export function PhotoCardWithReview({
  eventId,
  photo,
}: {
  eventId: string;
  photo: PhotoDto;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const token = session?.accessToken ?? "";
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (hidden) return null;

  async function deletePhoto(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (
      !confirm(
        "Delete this event photo permanently? This cannot be undone."
      )
    ) {
      return;
    }
    setDeleting(true);
    const res = await fetch(
      `${publicApiBase()}/events/${eventId}/photos/${photo.id}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
    );
    setDeleting(false);
    if (!res.ok) {
      alert("Could not delete photo.");
      return;
    }
    setHidden(true);
    router.refresh();
  }

  return (
    <>
      <div className="relative">
        <button
          type="button"
          className="w-full text-left"
          onClick={() => setOpen(true)}
        >
          <Card className="overflow-hidden transition-shadow hover:shadow-md">
            {photo.photoUrl ? (
              <div className="relative aspect-[4/3] w-full bg-card/50">
                <Image
                  src={photo.photoUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  unoptimized
                />
              </div>
            ) : null}
            <CardContent className="p-3 text-xs">
              <p>
                Status: <strong>{photo.status}</strong>
              </p>
              <p className="mt-1 text-muted-foreground">
                Proposed: {photo.proposedUserIds.length} · Confirmed:{" "}
                {photo.confirmedUserIds.length}
              </p>
              <p className="mt-2 text-primary">Click to review tags →</p>
            </CardContent>
          </Card>
        </button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          className="absolute right-2 top-2 z-10 opacity-90"
          disabled={deleting}
          onClick={deletePhoto}
        >
          {deleting ? "…" : "Delete"}
        </Button>
      </div>
      <PhotoReviewModal
        eventId={eventId}
        photo={photo}
        open={open}
        onOpenChange={setOpen}
        onDeleted={() => setHidden(true)}
      />
    </>
  );
}
