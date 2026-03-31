import type { DefaultSession } from "@auth/core/types";

declare module "@auth/core/types" {
  interface Session {
    accessToken?: string;
    user: DefaultSession["user"] & {
      id: string;
      role: "ADMIN" | "USER";
      eventId: string | null;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    accessToken?: string;
    role?: "ADMIN" | "USER";
    eventId?: string | null;
  }
}
