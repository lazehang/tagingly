"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
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
import { postLoginPath } from "@/lib/post-login";
import type { UserRole } from "@repo/types";

async function sessionAfterSignIn() {
  for (let i = 0; i < 5; i++) {
    const session = await getSession();
    if (session?.user?.role) {
      return session;
    }
    await new Promise((r) => setTimeout(r, 50 * (i + 1)));
  }
  return getSession();
}

function LoginForm() {
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setLoading(false);
      setError("Invalid email or password.");
      return;
    }

    const session = await sessionAfterSignIn();
    const role = session?.user?.role as UserRole | undefined;
    const destination = postLoginPath(role, nextParam);

    setLoading(false);
    // Full navigation so middleware sees the session cookie + role.
    window.location.assign(destination);
  }

  return (
    <Card className="w-full max-w-md border shadow-md">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Organizers (admin) go to the dashboard; attendees go to their gallery.
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
            <label className="form-label" htmlFor="email">
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Button type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
          <Button variant="link" className="px-0" asChild>
            <Link href="/register">Register for an event</Link>
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <main className="page-shell flex items-center justify-center p-4">
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
