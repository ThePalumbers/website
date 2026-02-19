import { PrismaClient } from "@prisma/client";
import { startMemoryDebugLogger } from "@/lib/debug/memory";

declare global {
  var prisma: PrismaClient | undefined;
}

const globalForPrisma = globalThis as typeof globalThis & { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

startMemoryDebugLogger();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
