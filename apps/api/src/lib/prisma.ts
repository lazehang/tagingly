import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

function usesAccelerate(url: string): boolean {
  return url.startsWith("prisma://") || url.startsWith("prisma+");
}

export function createPrismaClient(): PrismaClient {
  const client = new PrismaClient();
  const databaseUrl = process.env["DATABASE_URL"] ?? "";
  if (usesAccelerate(databaseUrl)) {
    return client.$extends(withAccelerate()) as unknown as PrismaClient;
  }
  return client;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env["NODE_ENV"] !== "production") {
  globalForPrisma.prisma = prisma;
}
