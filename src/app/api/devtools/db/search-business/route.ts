import { z } from "zod";
import { prisma } from "@/lib/db";
import { guardDevtoolsRoute } from "@/lib/devtools";
import { handleApiError, ok } from "@/lib/http";

export const runtime = "nodejs";

const querySchema = z.object({
  query: z.string().trim().max(120).optional().default(""),
  city: z.string().trim().max(80).optional().default(""),
  limit: z.coerce.number().int().min(1).max(20).optional().default(20),
});

export async function GET(request: Request) {
  const guard = await guardDevtoolsRoute();
  if (guard) return guard;

  try {
    const url = new URL(request.url);
    const parsed = querySchema.parse({
      query: url.searchParams.get("query") ?? "",
      city: url.searchParams.get("city") ?? "",
      limit: url.searchParams.get("limit") ?? 20,
    });

    const where = {
      AND: [
        parsed.query ? { name: { contains: parsed.query, mode: "insensitive" as const } } : {},
        parsed.city ? { city: { contains: parsed.city, mode: "insensitive" as const } } : {},
      ],
    };

    const items = await prisma.business.findMany({
      where,
      take: parsed.limit,
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        _count: { select: { feedbacks: true, photos: true, checkins: true } },
      },
    });

    return ok({ items, limit: parsed.limit });
  } catch (error) {
    return handleApiError(error);
  }
}
