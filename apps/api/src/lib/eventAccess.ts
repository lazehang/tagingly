import type { EventOrganizerRole, UserRole } from "@prisma/client";
import { prisma } from "./prisma.js";
import type { AccessPayload } from "./jwt.js";
import { isSuperadmin } from "./roles.js";
import { PermissionError } from "./permissions.js";

export async function getEventMembership(
  eventId: string,
  userId: string
) {
  return prisma.eventOrganizer.findUnique({
    where: { eventId_userId: { eventId, userId } },
  });
}

export async function canAccessEvent(
  auth: AccessPayload,
  eventId: string
): Promise<boolean> {
  if (isSuperadmin(auth.role)) return true;
  if (auth.role !== "ORGANIZER") return false;
  const membership = await getEventMembership(eventId, auth.sub);
  return membership != null;
}

export async function canManageEventOrganizers(
  auth: AccessPayload,
  eventId: string
): Promise<boolean> {
  if (isSuperadmin(auth.role)) return true;
  if (auth.role !== "ORGANIZER") return false;
  const membership = await getEventMembership(eventId, auth.sub);
  return membership?.role === "OWNER";
}

export async function assertCanAccessEvent(
  auth: AccessPayload,
  eventId: string
): Promise<void> {
  if (!(await canAccessEvent(auth, eventId))) {
    throw new PermissionError("You do not have access to this event");
  }
}

export async function assertCanManageEventOrganizers(
  auth: AccessPayload,
  eventId: string
): Promise<void> {
  if (!(await canManageEventOrganizers(auth, eventId))) {
    throw new PermissionError("Only event owners can manage organizers");
  }
}

export async function listAccessibleEvents(auth: AccessPayload) {
  if (isSuperadmin(auth.role)) {
    return prisma.event.findMany({ orderBy: { createdAt: "desc" } });
  }
  if (auth.role !== "ORGANIZER") {
    return [];
  }
  return prisma.event.findMany({
    where: {
      organizers: { some: { userId: auth.sub } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function addEventOrganizer(
  eventId: string,
  userId: string,
  role: EventOrganizerRole
) {
  return prisma.eventOrganizer.upsert({
    where: { eventId_userId: { eventId, userId } },
    create: { eventId, userId, role },
    update: { role },
  });
}

export function assertStaffRole(role: UserRole | string): void {
  if (!isSuperadmin(role) && role !== "ORGANIZER") {
    throw new PermissionError("User must be an organizer or superadmin");
  }
}
