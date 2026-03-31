import Link from "next/link";
import { Button } from "@repo/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-bold tracking-tight">Photo Tagging</h1>
      <p className="max-w-md text-center text-muted-foreground">
        Organizers manage events and uploads; attendees register with a selfie
        and view photos they appear in.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/admin">Admin dashboard</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/login">Sign in</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/register">Register</Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/portal">Attendee portal</Link>
        </Button>
      </div>
    </main>
  );
}
