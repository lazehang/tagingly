import type { Photo, User } from "@prisma/client";
import { prisma } from "./prisma.js";

export class PermissionError extends Error {
  constructor(
    message: string,
    readonly status = 403
  ) {
    super(message);
    this.name = "PermissionError";
  }
}

export function assertOwnUser(authUserId: string, targetUserId: string): void {
  if (authUserId !== targetUserId) {
    throw new PermissionError("Forbidden");
  }
}

export async function getPhotoForEvent(
  photoId: string,
  eventId: string
): Promise<Photo | null> {
  return prisma.photo.findFirst({ where: { id: photoId, eventId } });
}

export async function assertEventUser(
  eventId: string,
  userId: string
): Promise<User> {
  const user = await prisma.user.findFirst({
    where: { id: userId, eventId },
  });
  if (!user) {
    throw new PermissionError("User not in this event", 404);
  }
  return user;
}

export async function assertPhotoAccessibleToUser(
  photoId: string,
  userId: string
): Promise<{ photo: Photo; user: User }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.eventId) {
    throw new PermissionError("No event assigned", 404);
  }
  const photo = await prisma.photo.findFirst({
    where: { id: photoId, eventId: user.eventId },
  });
  if (!photo) {
    throw new PermissionError("Photo not found", 404);
  }
  if (!photo.confirmedUserIds.includes(userId)) {
    throw new PermissionError("You are not tagged on this photo", 403);
  }
  return { photo, user };
}
