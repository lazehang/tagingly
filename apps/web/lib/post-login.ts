import type { UserRole } from "@repo/types";
import { isStaff } from "@/lib/roles";

/** Where to send the user after a successful sign-in. */
export function postLoginPath(
  role: UserRole | undefined,
  nextParam: string | null
): string {
  const fallback = isStaff(role) ? "/admin" : "/portal";

  if (!nextParam) {
    return fallback;
  }

  if (isStaff(role)) {
    if (nextParam.startsWith("/admin")) {
      return nextParam;
    }
    return "/admin";
  }

  if (role === "USER") {
    if (
      nextParam.startsWith("/portal") ||
      nextParam === "/" ||
      nextParam.startsWith("/register")
    ) {
      return nextParam;
    }
    return "/portal";
  }

  return fallback;
}
