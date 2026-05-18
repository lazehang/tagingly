import Link from "next/link";
import { PageHeader } from "@/components/app-shell";
import { serverApiFetch } from "@/lib/server-api";
import { DeleteEventButton } from "../delete-event-button";
import type { EventDto } from "@repo/types";
import { Button } from "@repo/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";

export default async function AdminEventsPage() {
  const res = await serverApiFetch("/events");
  if (!res.ok) {
    return (
      <p className="text-destructive">
        Could not load events. Is the API running?
      </p>
    );
  }
  const { events } = (await res.json()) as { events: EventDto[] };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Events"
        description="Create an event, share its ID for registration, then upload and review crowd photos."
        actions={
          <Button asChild size="sm">
            <Link href="/admin/events/new">Create event</Link>
          </Button>
        }
      />

      <div className="grid gap-4">
        {events.map((e) => (
          <Card key={e.id} className="border-primary/10">
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0">
              <div className="min-w-0 space-y-1">
                <CardTitle className="text-lg">{e.name}</CardTitle>
                <CardDescription>
                  {new Date(e.date).toLocaleString()}
                </CardDescription>
                <p className="font-mono text-xs text-muted-foreground">
                  ID: {e.id}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" asChild>
                  <Link href={`/admin/events/${e.id}`}>Dashboard</Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/admin/events/${e.id}/photos`}>Photos</Link>
                </Button>
                <DeleteEventButton eventId={e.id} />
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4 border-t border-border/60 pt-4">
              <Button variant="link" className="h-auto px-0" asChild>
                <Link href={`/register?eventId=${e.id}`}>
                  Registration link
                </Link>
              </Button>
              <Button variant="link" className="h-auto px-0" asChild>
                <Link href={`/admin/events/${e.id}/settings`}>Settings</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {events.length === 0 ? (
        <div className="section-card flex flex-col items-center gap-3 p-8 text-center">
          <p className="text-muted-foreground">No events yet.</p>
          <Button asChild>
            <Link href="/admin/events/new">Create your first event</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
