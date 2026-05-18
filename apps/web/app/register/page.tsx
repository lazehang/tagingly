import { Suspense } from "react";
import { redirect } from "next/navigation";
import { RegisterPageClient } from "./register-client";
import { eventLandingPath } from "@/lib/event-urls";

type RegisterPageProps = {
  searchParams: Promise<{ eventId?: string }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const { eventId } = await searchParams;
  if (eventId?.trim()) {
    redirect(eventLandingPath(eventId.trim()));
  }

  return (
    <main className="page-shell flex items-center justify-center p-4">
      <Suspense
        fallback={
          <p className="text-muted-foreground">Loading…</p>
        }
      >
        <RegisterPageClient />
      </Suspense>
    </main>
  );
}
