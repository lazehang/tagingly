import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env["ADMIN_EMAIL"] ?? "admin@example.com";
  const password = process.env["ADMIN_PASSWORD"] ?? "admin-change-me";
  const name = process.env["ADMIN_NAME"] ?? "Admin";

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      name,
      role: UserRole.ADMIN,
    },
    update: {
      passwordHash,
      name,
      role: UserRole.ADMIN,
    },
  });

  console.log("Seeded admin user:", email);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    void prisma.$disconnect();
    process.exit(1);
  });
