import { randomUUID } from "node:crypto";
import type { User, UserSelfie } from "@prisma/client";
import { prisma } from "./prisma.js";
import { addSelfieEmbedding, deleteSelfieEmbeddingByKey } from "./weaviate.js";
import { getSignedReadUrl, uploadObject } from "./storage.js";
import type { UserSelfieDto } from "@repo/types";

const MAX_SELFIES = 5;

export async function toUserSelfieDto(
  selfie: UserSelfie
): Promise<UserSelfieDto> {
  return {
    id: selfie.id,
    storageKey: selfie.storageKey,
    url: await getSignedReadUrl(selfie.storageKey),
    createdAt: selfie.createdAt.toISOString(),
  };
}

/** Batch-load selfies for multiple users (e.g. admin tag review). */
export async function listSelfiesForUsers(
  userIds: string[]
): Promise<Map<string, UserSelfieDto[]>> {
  const out = new Map<string, UserSelfieDto[]>();
  if (userIds.length === 0) return out;

  const unique = [...new Set(userIds)];
  const rows = await prisma.userSelfie.findMany({
    where: { userId: { in: unique } },
    orderBy: { createdAt: "asc" },
  });

  const usersWithoutRows = unique.filter(
    (id) => !rows.some((r) => r.userId === id)
  );
  if (usersWithoutRows.length > 0) {
    const legacy = await prisma.user.findMany({
      where: { id: { in: usersWithoutRows }, selfieKey: { not: null } },
      select: { id: true, selfieKey: true },
    });
    for (const u of legacy) {
      if (!u.selfieKey) continue;
      const created = await prisma.userSelfie.create({
        data: { userId: u.id, storageKey: u.selfieKey },
      });
      rows.push(created);
    }
  }

  for (const id of unique) {
    const userRows = rows.filter((r) => r.userId === id);
    out.set(id, await Promise.all(userRows.map(toUserSelfieDto)));
  }
  return out;
}

export async function listUserSelfies(userId: string): Promise<UserSelfieDto[]> {
  let rows = await prisma.userSelfie.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  if (rows.length === 0) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.selfieKey) {
      const created = await prisma.userSelfie.create({
        data: { userId, storageKey: user.selfieKey },
      });
      rows = [created];
    }
  }
  return Promise.all(rows.map(toUserSelfieDto));
}

export async function addUserSelfie(args: {
  user: User;
  buffer: Buffer;
  mimeType: string;
}): Promise<UserSelfieDto> {
  if (!args.user.eventId) {
    throw new Error("User has no event");
  }
  const count = await prisma.userSelfie.count({
    where: { userId: args.user.id },
  });
  if (count >= MAX_SELFIES) {
    throw new Error(`Maximum ${MAX_SELFIES} selfies allowed`);
  }

  const { descriptorFromSelfieImage, releaseFacePipelineMemory } =
    await import("./face.js");
  const desc = await descriptorFromSelfieImage(args.buffer);
  releaseFacePipelineMemory();
  if (!desc) {
    throw new Error("No face detected in selfie");
  }

  const storageKey = `events/${args.user.eventId}/selfies/${randomUUID()}.jpg`;
  await uploadObject(storageKey, args.buffer, args.mimeType || "image/jpeg");

  const selfie = await prisma.userSelfie.create({
    data: { userId: args.user.id, storageKey },
  });

  await addSelfieEmbedding({
    userId: args.user.id,
    eventId: args.user.eventId,
    selfieKey: storageKey,
    vector: Array.from(desc),
  });

  if (!args.user.selfieKey) {
    await prisma.user.update({
      where: { id: args.user.id },
      data: { selfieKey: storageKey },
    });
  }

  return toUserSelfieDto(selfie);
}

export async function deleteUserSelfie(args: {
  user: User;
  selfieId: string;
}): Promise<void> {
  const selfie = await prisma.userSelfie.findFirst({
    where: { id: args.selfieId, userId: args.user.id },
  });
  if (!selfie) {
    throw new Error("Selfie not found");
  }
  const count = await prisma.userSelfie.count({
    where: { userId: args.user.id },
  });
  if (count <= 1) {
    throw new Error("At least one selfie is required");
  }

  await deleteSelfieEmbeddingByKey(args.user.id, selfie.storageKey);
  await prisma.userSelfie.delete({ where: { id: selfie.id } });

  if (args.user.selfieKey === selfie.storageKey) {
    const next = await prisma.userSelfie.findFirst({
      where: { userId: args.user.id },
      orderBy: { createdAt: "asc" },
    });
    await prisma.user.update({
      where: { id: args.user.id },
      data: { selfieKey: next?.storageKey ?? null },
    });
  }
}

export async function createSelfiesFromRegistration(args: {
  userId: string;
  eventId: string;
  files: Express.Multer.File[];
}): Promise<string | null> {
  const { descriptorFromSelfieImage, releaseFacePipelineMemory } =
    await import("./face.js");
  let primaryKey: string | null = null;
  for (const file of args.files) {
    const desc = await descriptorFromSelfieImage(file.buffer);
    releaseFacePipelineMemory();
    if (!desc) continue;
    const storageKey = `events/${args.eventId}/selfies/${randomUUID()}.jpg`;
    await uploadObject(
      storageKey,
      file.buffer,
      file.mimetype || "image/jpeg"
    );
    await prisma.userSelfie.create({
      data: { userId: args.userId, storageKey },
    });
    await addSelfieEmbedding({
      userId: args.userId,
      eventId: args.eventId,
      selfieKey: storageKey,
      vector: Array.from(desc),
    });
    if (!primaryKey) primaryKey = storageKey;
  }
  return primaryKey;
}
