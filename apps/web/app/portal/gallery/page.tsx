import { PageHeader } from "@/components/app-shell";
import { serverApiFetch } from "@/lib/server-api";
import { PhotoGallery } from "../photo-gallery";
import type { PhotoDto, UserPhotosResponse, UserPublicDto } from "@repo/types";

export default async function PortalGalleryPage() {
  const meRes = await serverApiFetch("/auth/me");
  if (!meRes.ok) {
    return <p className="text-destructive">Could not load profile.</p>;
  }
  const meData = (await meRes.json()) as {
    user: UserPublicDto;
    event?: { allowUserDownloads: boolean };
  };
  const { event } = meData;

  const phRes = await serverApiFetch("/users/me/photos");
  if (!phRes.ok) {
    return <p className="text-destructive">Could not load photos.</p>;
  }
  const { photos, allowUserDownloads } =
    (await phRes.json()) as UserPhotosResponse;

  const allowDownload =
    allowUserDownloads ?? event?.allowUserDownloads ?? false;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My gallery"
        description="Photos you have been tagged in. Browse the grid and click to open."
      />
      <PhotoGallery
        photos={photos as PhotoDto[]}
        allowUserDownloads={allowDownload}
      />
    </div>
  );
}
