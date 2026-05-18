"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Input } from "@repo/ui/input";
import { Button } from "@repo/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { publicApiBase } from "@/lib/api";
import { eventLandingPath } from "@/lib/event-urls";
import type { EventDto } from "@repo/types";

/** Fallback when someone opens /register without an event link. */
export function RegisterPageClient() {
  const [eventId, setEventId] = useState("");
  const [eventInfo, setEventInfo] = useState<EventDto | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!eventId.trim()) {
      setEventInfo(null);
      return;
    }
    let cancelled = false;
    setChecking(true);
    void (async () => {
      try {
        const res = await fetch(
          `${publicApiBase()}/events/${eventId.trim()}/public`
        );
        if (!res.ok) throw new Error("not found");
        const ev = (await res.json()) as EventDto;
        if (!cancelled) setEventInfo(ev);
      } catch {
        if (!cancelled) setEventInfo(null);
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  return (
    <Card className="w-full max-w-md border shadow-md">
      <CardHeader>
        <CardTitle>Register for an event</CardTitle>
        <CardDescription>
          Open the registration link from your organizer, or enter your event ID
          below to continue.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="eventId">
            Event ID
          </label>
          <Input
            id="eventId"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            placeholder="Paste from your invite"
          />
          {checking ? (
            <p className="text-sm text-muted-foreground">Checking event…</p>
          ) : eventInfo ? (
            <p className="text-sm text-muted-foreground">
              Found <strong>{eventInfo.name}</strong> (
              {new Date(eventInfo.date).toLocaleDateString()})
            </p>
          ) : eventId.trim() ? (
            <p className="text-sm text-destructive">Event not found.</p>
          ) : null}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Button asChild disabled={!eventInfo}>
          <Link href={eventInfo ? eventLandingPath(eventId.trim()) : "#"}>
            Continue to registration
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/login">Already have an account</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
