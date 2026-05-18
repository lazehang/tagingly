import type { DefaultSession } from "@auth/core/types";
import type { UserRole } from "@repo/types";

declare module "@auth/core/types" {
  interface Session {
    accessToken?: string;
    user: DefaultSession["user"] & {
      id: string;
      role: UserRole;
      eventId: string | null;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    accessToken?: string;
    role?: UserRole;
    eventId?: string | null;
  }
}
