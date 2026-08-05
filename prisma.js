import { PrismaClient } from "@prisma/client";

// Prevents creating a new Prisma Client on every hot-reload in dev,
// which otherwise exhausts your Neon connection limit fast.
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
