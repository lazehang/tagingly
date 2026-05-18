import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Session } from "@auth/core/types";
import { auth } from "@/lib/auth";
import { isStaff, isSuperadmin, normalizeUserRole } from "@/lib/roles";

export default auth((req: NextRequest & { auth: Session | null }) => {
  const path = req.nextUrl.pathname;
  const role = normalizeUserRole(req.auth?.user?.role);
  const loggedIn = !!req.auth;

  if (path.startsWith("/admin")) {
    if (!loggedIn) {
      const url = new URL("/login", req.nextUrl.origin);
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }
    if (!isStaff(role)) {
      return NextResponse.redirect(new URL("/portal", req.nextUrl.origin));
    }
    if (path.startsWith("/admin/users") && !isSuperadmin(role)) {
      return NextResponse.redirect(new URL("/admin", req.nextUrl.origin));
    }
  }

  if (path.startsWith("/portal")) {
    if (!loggedIn) {
      const url = new URL("/login", req.nextUrl.origin);
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/portal/:path*"],
};
