import { redirect } from "next/navigation";
import { PageHeader } from "@/components/app-shell";
import { auth } from "@/lib/auth";
import { isSuperadmin } from "@/lib/roles";
import { serverApiFetch } from "@/lib/server-api";
import { UserManagement } from "./user-management";
import type { EventDto, UserPublicDto } from "@repo/types";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!isSuperadmin(session?.user?.role)) {
    redirect("/admin");
  }

  const [usersRes, eventsRes] = await Promise.all([
    serverApiFetch("/admin/users"),
    serverApiFetch("/events"),
  ]);

  if (!usersRes.ok) {
    return <p className="text-destructive">Could not load users.</p>;
  }
  const { users } = (await usersRes.json()) as { users: UserPublicDto[] };
  const events = eventsRes.ok
    ? ((await eventsRes.json()) as { events: EventDto[] }).events
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="User management"
        description="Superadmin: set platform roles and grant organizers access to specific events."
      />
      <UserManagement initialUsers={users} initialEvents={events} />
    </div>
  );
}
