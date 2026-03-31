"use client";

import { signOut } from "next-auth/react";
import { Button } from "@repo/ui/button";

export function SignOutButton() {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => void signOut({ callbackUrl: "/" })}
    >
      Sign out
    </Button>
  );
}
