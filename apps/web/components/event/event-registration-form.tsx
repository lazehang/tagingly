"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

type EventRegistrationFormProps = {
  eventId: string;
  event: EventDto;
  /** When true, renders without outer Card (for embedding on event landing). */
  embedded?: boolean;
};

export function EventRegistrationForm({
  eventId,
  event,
  embedded = false,
}: EventRegistrationFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData();
    fd.append("eventId", eventId);
    fd.append("name", name);
    fd.append("email", email);
    fd.append("password", password);
    const selfieInput = document.getElementById(
      `selfies-${eventId}`
    ) as HTMLInputElement;
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

  const formFields = (
    <>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
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
        <label className="text-sm font-medium" htmlFor={`selfies-${eventId}`}>
          Selfies (1–5)
        </label>
        <Input
          id={`selfies-${eventId}`}
          type="file"
          accept="image/*"
          multiple
          required
        />
        <p className="text-xs text-muted-foreground">
          Add multiple angles or lighting for better matching in{" "}
          <strong>{event.name}</strong>.
        </p>
      </div>
    </>
  );

  const formActions = (
    <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
      <Button type="submit" disabled={loading}>
        {loading ? "Creating account…" : "Create account"}
      </Button>
      <Button variant="outline" asChild>
        <Link href="/login">Already have an account</Link>
      </Button>
    </div>
  );

  if (embedded) {
    return (
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight">
            Register for this event
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your account with one or more clear selfies so we can find you
            in photos after they are uploaded.
          </p>
        </div>
        <div className="flex flex-col gap-4">{formFields}</div>
        {formActions}
      </form>
    );
  }

  return (
    <Card className="w-full max-w-md border shadow-md">
      <CardHeader>
        <CardTitle>Register</CardTitle>
        <CardDescription>
          Join <strong>{event.name}</strong> (
          {new Date(event.date).toLocaleDateString()}) with your name and
          selfies.
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="flex flex-col gap-4">{formFields}</CardContent>
        <CardFooter>{formActions}</CardFooter>
      </form>
    </Card>
  );
}
