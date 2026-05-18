import {
  TagExclusionReason,
  type Photo,
  type Prisma,
} from "@prisma/client";
import { prisma } from "./prisma.js";
import type { PhotoDetailDto, TaggedUserDto } from "@repo/types";
import { getSignedReadUrl } from "./storage.js";

export type ProposedMatchMetaEntry = { userId: string; certainty: number };

export function parseProposedMatchMeta(
  raw: Prisma.JsonValue | null
): ProposedMatchMetaEntry[] {
  if (!raw || !Array.isArray(raw)) return [];
  const out: ProposedMatchMetaEntry[] = [];
  for (const item of raw) {
    if (
      item &&
      typeof item === "object" &&
      "userId" in item &&
      "certainty" in item &&
      typeof (item as ProposedMatchMetaEntry).userId === "string" &&
      typeof (item as ProposedMatchMetaEntry).certainty === "number"
    ) {
      out.push(item as ProposedMatchMetaEntry);
    }
  }
  return out;
}

export async function getExcludedUserIds(photoId: string): Promise<Set<string>> {
  const rows = await prisma.tagExclusion.findMany({
    where: { photoId },
    select: { userId: true },
  });
  return new Set(rows.map((r) => r.userId));
}

async function upsertExclusion(args: {
  photoId: string;
  userId: string;
  reason: TagExclusionReason;
  createdByUserId: string;
}): Promise<void> {
  await prisma.tagExclusion.upsert({
    where: {
      photoId_userId: { photoId: args.photoId, userId: args.userId },
    },
    create: {
      photoId: args.photoId,
      userId: args.userId,
      reason: args.reason,
      createdByUserId: args.createdByUserId,
    },
    update: {
      reason: args.reason,
      createdByUserId: args.createdByUserId,
    },
  });
}

async function clearExclusion(photoId: string, userId: string): Promise<void> {
  await prisma.tagExclusion.deleteMany({
    where: { photoId, userId },
  });
}

function removeFromProposed(photo: Photo, userId: string): {
  proposedUserIds: string[];
  proposedMatchMeta: ProposedMatchMetaEntry[];
} {
  const meta = parseProposedMatchMeta(photo.proposedMatchMeta);
  return {
    proposedUserIds: photo.proposedUserIds.filter((id) => id !== userId),
    proposedMatchMeta: meta.filter((m) => m.userId !== userId),
  };
}

export async function confirmProposedTag(args: {
  photoId: string;
  userId: string;
}): Promise<Photo> {
  const photo = await prisma.photo.findUnique({ where: { id: args.photoId } });
  if (!photo) throw new Error("Photo not found");
  if (!photo.proposedUserIds.includes(args.userId)) {
    throw new Error("User not in proposed tags");
  }
  const { proposedUserIds, proposedMatchMeta } = removeFromProposed(
    photo,
    args.userId
  );
  const confirmedUserIds = Array.from(
    new Set([...photo.confirmedUserIds, args.userId])
  );
  return prisma.photo.update({
    where: { id: args.photoId },
    data: {
      proposedUserIds,
      proposedMatchMeta: proposedMatchMeta as unknown as Prisma.InputJsonValue,
      confirmedUserIds,
    },
  });
}

export async function rejectProposedTag(args: {
  photoId: string;
  userId: string;
  createdByUserId: string;
}): Promise<Photo> {
  const photo = await prisma.photo.findUnique({ where: { id: args.photoId } });
  if (!photo) throw new Error("Photo not found");
  const { proposedUserIds, proposedMatchMeta } = removeFromProposed(
    photo,
    args.userId
  );
  await upsertExclusion({
    photoId: args.photoId,
    userId: args.userId,
    reason: TagExclusionReason.ADMIN_REJECT_PROPOSED,
    createdByUserId: args.createdByUserId,
  });
  return prisma.photo.update({
    where: { id: args.photoId },
    data: {
      proposedUserIds,
      proposedMatchMeta: proposedMatchMeta as unknown as Prisma.InputJsonValue,
      confirmedUserIds: photo.confirmedUserIds.filter((id) => id !== args.userId),
    },
  });
}

export async function addManualConfirmedTag(args: {
  photoId: string;
  userId: string;
}): Promise<Photo> {
  const photo = await prisma.photo.findUnique({ where: { id: args.photoId } });
  if (!photo) throw new Error("Photo not found");
  await clearExclusion(args.photoId, args.userId);
  const { proposedUserIds, proposedMatchMeta } = removeFromProposed(
    photo,
    args.userId
  );
  return prisma.photo.update({
    where: { id: args.photoId },
    data: {
      proposedUserIds,
      proposedMatchMeta: proposedMatchMeta as unknown as Prisma.InputJsonValue,
      confirmedUserIds: Array.from(
        new Set([...photo.confirmedUserIds, args.userId])
      ),
    },
  });
}

export async function removeConfirmedTag(args: {
  photoId: string;
  userId: string;
  createdByUserId: string;
  reason: TagExclusionReason;
}): Promise<Photo> {
  const photo = await prisma.photo.findUnique({ where: { id: args.photoId } });
  if (!photo) throw new Error("Photo not found");
  await upsertExclusion({
    photoId: args.photoId,
    userId: args.userId,
    reason: args.reason,
    createdByUserId: args.createdByUserId,
  });
  const { proposedUserIds, proposedMatchMeta } = removeFromProposed(
    photo,
    args.userId
  );
  return prisma.photo.update({
    where: { id: args.photoId },
    data: {
      proposedUserIds,
      proposedMatchMeta: proposedMatchMeta as unknown as Prisma.InputJsonValue,
      confirmedUserIds: photo.confirmedUserIds.filter((id) => id !== args.userId),
    },
  });
}

export async function userRemoveSelfTag(args: {
  photoId: string;
  userId: string;
}): Promise<Photo> {
  return removeConfirmedTag({
    photoId: args.photoId,
    userId: args.userId,
    createdByUserId: args.userId,
    reason: TagExclusionReason.USER_REMOVE_SELF,
  });
}

export async function bulkConfirmProposed(args: {
  photoId: string;
}): Promise<Photo> {
  const photo = await prisma.photo.findUnique({ where: { id: args.photoId } });
  if (!photo) throw new Error("Photo not found");
  const excluded = await getExcludedUserIds(args.photoId);
  const toConfirm = photo.proposedUserIds.filter((id) => !excluded.has(id));
  const confirmedUserIds = Array.from(
    new Set([...photo.confirmedUserIds, ...toConfirm])
  );
  return prisma.photo.update({
    where: { id: args.photoId },
    data: {
      proposedUserIds: [],
      proposedMatchMeta: [],
      confirmedUserIds,
    },
  });
}

export async function buildTaggedUsers(
  photo: Photo
): Promise<TaggedUserDto[]> {
  const meta = parseProposedMatchMeta(photo.proposedMatchMeta);
  const certaintyByUser = new Map(meta.map((m) => [m.userId, m.certainty]));
  const allIds = Array.from(
    new Set([...photo.proposedUserIds, ...photo.confirmedUserIds])
  );
  if (allIds.length === 0) return [];
  const users = await prisma.user.findMany({
    where: { id: { in: allIds } },
    select: { id: true, name: true, email: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));
  const confirmedSet = new Set(photo.confirmedUserIds);
  const tagged: TaggedUserDto[] = [];

  for (const id of photo.confirmedUserIds) {
    const u = userMap.get(id);
    if (!u) continue;
    tagged.push({
      id: u.id,
      name: u.name,
      email: u.email,
      certainty: certaintyByUser.get(id),
      tagKind: "confirmed",
    });
  }
  for (const id of photo.proposedUserIds) {
    if (confirmedSet.has(id)) continue;
    const u = userMap.get(id);
    if (!u) continue;
    tagged.push({
      id: u.id,
      name: u.name,
      email: u.email,
      certainty: certaintyByUser.get(id),
      tagKind: "proposed",
    });
  }
  return tagged;
}

export async function toPhotoDetailDto(photo: Photo): Promise<PhotoDetailDto> {
  return {
    id: photo.id,
    eventId: photo.eventId,
    storageKey: photo.storageKey,
    proposedUserIds: photo.proposedUserIds,
    confirmedUserIds: photo.confirmedUserIds,
    status: photo.status,
    photoUrl: await getSignedReadUrl(photo.storageKey),
    createdAt: photo.createdAt.toISOString(),
    updatedAt: photo.updatedAt.toISOString(),
    taggedUsers: await buildTaggedUsers(photo),
  };
}
