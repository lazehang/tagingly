"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { publicApiBase } from "@/lib/api";
import type { EventDto } from "@repo/types";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventIdParam = searchParams.get("eventId") ?? "";
  const [eventId, setEventId] = useState(eventIdParam);
  const [eventInfo, setEventInfo] = useState<EventDto | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`${publicApiBase()}/events/${eventId}/public`);
        if (!res.ok) throw new Error("not found");
        const ev = (await res.json()) as EventDto;
        if (!cancelled) setEventInfo(ev);
      } catch {
        if (!cancelled) setEventInfo(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!eventId) {
      setError("Event ID is required. Open the registration link from your organizer.");
      return;
    }
    setLoading(true);
    const fd = new FormData();
    fd.append("eventId", eventId);
    fd.append("name", name);
    fd.append("email", email);
    fd.append("password", password);
    const selfieInput = document.getElementById("selfies") as HTMLInputElement;
    const files = selfieInput?.files;
    if (!files?.length) {
      setError("Please choose at least one selfie photo.");
      setLoading(false);
      return;
    }
    if (files.length > 5) {
      setError("Maximum 5 selfies allowed.");
      setLoading(false);
      return;
    }
    for (let i = 0; i < files.length; i++) {
      fd.append("selfies", files[i]!);
    }

    const res = await fetch(`${publicApiBase()}/auth/register`, {
      method: "POST",
      body: fd,
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Registration failed.");
      setLoading(false);
      return;
    }

    const sign = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (sign?.error) {
      setError("Account created but sign-in failed. Try logging in.");
      return;
    }
    router.push("/portal");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md border shadow-md">
      <CardHeader>
        <CardTitle>Register</CardTitle>
        <CardDescription>
          Join an event with your name and one or more clear selfies so we can
          find you in photos.
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="flex flex-col gap-4">
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="eventId">
              Event ID
            </label>
            <Input
              id="eventId"
              required
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              placeholder="Paste event id from your invite"
            />
            {eventInfo ? (
              <p className="text-sm text-muted-foreground">
                Registering for <strong>{eventInfo.name}</strong> (
                {new Date(eventInfo.date).toLocaleDateString()})
              </p>
            ) : eventId ? (
              <p className="text-sm text-destructive">
                Event not found. Check the ID.
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="name">
              Full name
            </label>
            <Input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">
              Email
            </label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">
              Password
            </label>
            <Input
              id="password"
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="selfies">
              Selfies (1–5)
            </label>
            <Input
              id="selfies"
              type="file"
              accept="image/*"
              multiple
              required
            />
            <p className="text-xs text-muted-foreground">
              Add multiple angles or lighting for better matching.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Button type="submit" disabled={loading || !eventInfo}>
            {loading ? "Creating account…" : "Create account"}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/login">Already have an account</Link>
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <main className="page-shell flex items-center justify-center p-4">
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <RegisterForm />
      </Suspense>
    </main>
  );
}
