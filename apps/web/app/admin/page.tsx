import Link from "next/link";
import { serverApiFetch } from "@/lib/server-api";
import { AdminCreateEventForm } from "./create-event-form";
import { DeleteEventButton } from "./delete-event-button";
import type { EventDto } from "@repo/types";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Button } from "@repo/ui/button";

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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Events</h1>
        <p className="text-sm text-muted-foreground">
          Create an event, share its ID for registration, then upload crowd photos.
        </p>
      </div>
      <AdminCreateEventForm />
      <div className="grid gap-4 sm:grid-cols-2">
        {events.map((e) => (
          <Card key={e.id}>
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
              <div>
                <CardTitle className="text-lg">{e.name}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {new Date(e.date).toLocaleString()}
                </p>
                <p className="mt-2 font-mono text-xs text-muted-foreground">
                  ID: {e.id}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" asChild>
                  <Link href={`/admin/events/${e.id}`}>Manage</Link>
                </Button>
                <DeleteEventButton eventId={e.id} />
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="link" className="h-auto px-0" asChild>
                <Link href={`/register?eventId=${e.id}`}>Open registration link</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No events yet.</p>
      ) : null}
    </div>
  );
}
