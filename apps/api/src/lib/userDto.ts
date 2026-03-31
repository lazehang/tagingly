import type { User } from "@prisma/client";
import type { UserPublicDto } from "@repo/types";

export function toUserPublic(user: User): UserPublicDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    eventId: user.eventId,
    selfieKey: user.selfieKey,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
