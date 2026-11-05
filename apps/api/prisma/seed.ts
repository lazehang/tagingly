import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createPrismaClient } from "../src/lib/prisma.js";

const prisma = createPrismaClient();

async function main() {
  const email = process.env["ADMIN_EMAIL"] ?? "admin@example.com";
  const password = process.env["ADMIN_PASSWORD"] ?? "change-me-admin";
  const name = process.env["ADMIN_NAME"] ?? "Superadmin";

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      name,
      role: UserRole.SUPERADMIN,
    },
    update: {
      passwordHash,
      name,
      role: UserRole.SUPERADMIN,
    },
  });

  const superadmin = await prisma.user.findUnique({ where: { email } });

  const eventsWithoutTeam = await prisma.event.findMany({
    where: { organizers: { none: {} } },
  });
  for (const event of eventsWithoutTeam) {
    const ownerId = event.createdById ?? superadmin?.id;
    if (ownerId) {
      await prisma.eventOrganizer.create({
        data: {
          eventId: event.id,
          userId: ownerId,
          role: "OWNER",
        },
      });
      if (!event.createdById) {
        await prisma.event.update({
          where: { id: event.id },
          data: { createdById: ownerId },
        });
      }
    }
  }

  console.log("Seeded superadmin user:", email);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    void prisma.$disconnect();
    process.exit(1);
  });
