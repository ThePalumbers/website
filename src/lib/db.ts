import { PrismaClient } from "@prisma/client";
import { startMemoryDebugLogger } from "@/lib/debug/memory";

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma ?? new PrismaClient();

startMemoryDebugLogger();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
