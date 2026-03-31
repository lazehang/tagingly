import { PhotoStatus } from "@prisma/client";
import { prisma } from "./prisma.js";
import { getObjectBuffer } from "./storage.js";
import { descriptorsFromEventPhoto } from "./face.js";
import { matchUsersByFace } from "./weaviate.js";

export async function processEventPhoto(photoId: string): Promise<void> {
  const photo = await prisma.photo.findUnique({ where: { id: photoId } });
  if (!photo) return;

  try {
    const buffer = await getObjectBuffer(photo.storageKey);
    const descs = await descriptorsFromEventPhoto(buffer);
    const matched = new Set<string>();
    for (const d of descs) {
      const ids = await matchUsersByFace({
        vector: Array.from(d),
        eventId: photo.eventId,
        minCertainty: 0.5,
      });
      for (const id of ids) matched.add(id);
    }
    await prisma.photo.update({
      where: { id: photoId },
      data: {
        taggedUserIds: [...matched],
        status: PhotoStatus.PROCESSED,
      },
    });
  } catch (e) {
    console.error("processEventPhoto", photoId, e);
    await prisma.photo.update({
      where: { id: photoId },
      data: { status: PhotoStatus.FAILED },
    });
  }
}
