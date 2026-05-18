import type { UserRole } from "@repo/types";

export function normalizeUserRole(role: string | undefined): UserRole {
  if (role === "ADMIN") return "SUPERADMIN";
  if (role === "SUPERADMIN" || role === "ORGANIZER" || role === "USER") {
    return role;
  }
  return "USER";
}

export function isSuperadmin(role: string | undefined): boolean {
  return normalizeUserRole(role) === "SUPERADMIN";
}

export function isStaff(role: string | undefined): boolean {
  const r = normalizeUserRole(role);
  return r === "SUPERADMIN" || r === "ORGANIZER";
}
