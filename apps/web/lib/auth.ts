import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { UserPublicDto, UserRole } from "@repo/types";
import { normalizeUserRole } from "@/lib/roles";
import type { JWT } from "@auth/core/jwt";
import type { Session, User } from "@auth/core/types";

const apiBase = (
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000"
).replace(/\/$/, "");

type UserJWT = User & {
  accessToken?: string;
  role: UserRole;
  eventId: string | null;
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const password = credentials?.password;
        if (!email || !password) return null;

        const res = await fetch(`${apiBase}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (!res.ok) return null;

        const data = (await res.json()) as {
          token: string;
          user: UserPublicDto;
        };

        return {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: normalizeUserRole(data.user.role),
          eventId: data.user.eventId,
          accessToken: data.token,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user: User | undefined }) {
      if (user) {
        const u = user as UserJWT;
        token.accessToken = u.accessToken;
        token.role = u.role;
        token.eventId = u.eventId;
      }
      return token;
    },
    async session({
      session,
      token,
    }: {
      session: Session;
      token: JWT;
    }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = normalizeUserRole(
          token.role as string | undefined
        );
        session.user.eventId = (token.eventId as string | null) ?? null;
      }
      session.accessToken =
        typeof token.accessToken === "string" ? token.accessToken : undefined;
      return session;
    },
  },
});
