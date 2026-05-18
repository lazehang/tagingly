import type { UserRole } from "@prisma/client";

export type StaffRole = "SUPERADMIN" | "ORGANIZER";

export function normalizeUserRole(role: string): UserRole {
  if (role === "ADMIN") return "SUPERADMIN";
  if (role === "SUPERADMIN" || role === "ORGANIZER" || role === "USER") {
    return role;
  }
  return "USER";
}

export function isSuperadmin(role: string): boolean {
  return normalizeUserRole(role) === "SUPERADMIN";
}

export function isStaff(role: string): boolean {
  const r = normalizeUserRole(role);
  return r === "SUPERADMIN" || r === "ORGANIZER";
}
