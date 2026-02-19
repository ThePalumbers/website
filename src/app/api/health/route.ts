import { prisma } from "@/lib/db";
import { ok, handleApiError } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return ok({ status: "ok" });
  } catch (error) {
    return handleApiError(error);
  }
}
