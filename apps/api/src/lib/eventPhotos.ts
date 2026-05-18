import { prisma } from "./prisma.js";
import { getPhotoForEvent } from "./permissions.js";
import { deleteObject } from "./storage.js";

export async function deleteEventPhoto(
  eventId: string,
  photoId: string
): Promise<void> {
  const photo = await getPhotoForEvent(photoId, eventId);
  if (!photo) {
    throw new Error("Photo not found");
  }
  await deleteObject(photo.storageKey);
  await prisma.photo.delete({ where: { id: photoId } });
}
