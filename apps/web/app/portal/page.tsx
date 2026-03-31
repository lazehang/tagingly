import Image from "next/image";
import { serverApiFetch } from "@/lib/server-api";
import { ProfileForm } from "./profile-form";
import type { PhotoDto, UserPublicDto } from "@repo/types";

export default async function PortalPage() {
  const meRes = await serverApiFetch("/auth/me");
  if (!meRes.ok) {
    return <p className="text-destructive">Could not load profile.</p>;
  }
  const { user } = (await meRes.json()) as { user: UserPublicDto };

  const phRes = await serverApiFetch("/users/me/photos");
  if (!phRes.ok) {
    return <p className="text-destructive">Could not load photos.</p>;
  }
  const { photos } = (await phRes.json()) as { photos: PhotoDto[] };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Your portal</h1>
        <p className="text-sm text-muted-foreground">
          {user.email}
          {user.eventId ? (
            <>
              {" "}
              · Event <span className="font-mono text-xs">{user.eventId}</span>
            </>
          ) : null}
        </p>
      </div>
      <ProfileForm initialName={user.name} />
      <div>
        <h2 className="mb-4 text-lg font-medium">Tagged photos</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((p) => (
            <div
              key={p.id}
              className="overflow-hidden rounded-lg border bg-card shadow-sm"
            >
              {p.photoUrl ? (
                <div className="relative aspect-[4/3] w-full bg-muted">
                  <Image
                    src={p.photoUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    unoptimized
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>
        {photos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tagged photos yet. After organizers upload event photos and
            processing finishes, matches appear here.
          </p>
        ) : null}
      </div>
    </div>
  );
}
