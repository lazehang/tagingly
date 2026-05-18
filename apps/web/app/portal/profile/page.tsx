import { PageHeader } from "@/components/app-shell";
import { serverApiFetch } from "@/lib/server-api";
import { ProfileForm } from "../profile-form";
import type { UserPublicDto } from "@repo/types";

export default async function PortalProfilePage() {
  const meRes = await serverApiFetch("/auth/me");
  if (!meRes.ok) {
    return <p className="text-destructive">Could not load profile.</p>;
  }
  const { user } = (await meRes.json()) as { user: UserPublicDto };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Your display name and reference selfies power face matching for your event."
      />
      <ProfileForm
        initialName={user.name}
        initialSelfies={user.selfies ?? []}
      />
    </div>
  );
}
