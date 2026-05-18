import Link from "next/link";
import { PageHeader } from "@/components/app-shell";
import { QuickLinkCard } from "@/components/dashboard/quick-link-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { auth } from "@/lib/auth";
import { isSuperadmin } from "@/lib/roles";
import { serverApiFetch } from "@/lib/server-api";
import type { EventDto } from "@repo/types";

export default async function AdminOverviewPage() {
  const session = await auth();
  const showUsers = isSuperadmin(session?.user?.role);
  const res = await serverApiFetch("/events");
  if (!res.ok) {
    return (
      <p className="text-destructive">
        Could not load events. Is the API running?
      </p>
    );
  }
  const { events } = (await res.json()) as { events: EventDto[] };
  const recent = [...events]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin overview"
        description="Manage events, upload crowd photos, and review AI-proposed tags."
        actions={
          <Button asChild size="sm">
            <Link href="/admin/events/new">Create event</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total events" value={events.length} />
        <StatCard
          label="Latest event"
          value={recent[0]?.name ?? "—"}
          hint={
            recent[0]
              ? new Date(recent[0].date).toLocaleDateString()
              : "Create your first event"
          }
        />
        <StatCard label="Workflow" value="Review → Publish" hint="Confirm tags before guests see them" />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Quick actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickLinkCard
            href="/admin/events/new"
            title="Create event"
            description="Add a new event and share its ID for attendee registration."
          />
          <QuickLinkCard
            href="/admin/events"
            title="All events"
            description="Browse, manage, and open event dashboards."
          />
          {showUsers ? (
            <QuickLinkCard
              href="/admin/users"
              title="User management"
              description="Set roles and assign organizers to events."
            />
          ) : (
            <QuickLinkCard
              href="/register"
              title="Registration page"
              description="Preview the public attendee sign-up flow."
            />
          )}
        </div>
      </section>

      {recent.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Recent events
            </h2>
            <Button variant="link" className="h-auto px-0" asChild>
              <Link href="/admin/events">View all</Link>
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {recent.map((e) => (
              <Card key={e.id} className="border-primary/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{e.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {new Date(e.date).toLocaleString()}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button size="sm" asChild>
                    <Link href={`/admin/events/${e.id}`}>Open</Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/admin/events/${e.id}/photos`}>Photos</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
