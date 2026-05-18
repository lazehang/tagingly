import Link from "next/link";
import { PageHeader } from "@/components/app-shell";
import { AdminCreateEventForm } from "../../create-event-form";
import { Button } from "@repo/ui/button";

export default function AdminNewEventPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Create event"
        description="Add a new event. Share the event ID with attendees for registration."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/events">← All events</Link>
          </Button>
        }
      />
      <section className="section-card p-6">
        <AdminCreateEventForm />
      </section>
    </div>
  );
}
