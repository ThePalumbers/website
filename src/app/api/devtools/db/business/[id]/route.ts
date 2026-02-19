import { z } from "zod";
import { prisma } from "@/lib/db";
import { guardDevtoolsRoute } from "@/lib/devtools";
import { fail, handleApiError, ok } from "@/lib/http";

export const runtime = "nodejs";

const paramsSchema = z.object({
  id: z.string().trim().min(1).max(64),
});

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardDevtoolsRoute();
  if (guard) return guard;

  try {
    const parsed = paramsSchema.parse(await params);

    const business = await prisma.business.findUnique({
      where: { id: parsed.id },
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        street: true,
        postalCode: true,
        _count: { select: { photos: true, checkins: true, feedbacks: true } },
        businessCategories: {
          select: { category: { select: { id: true, name: true } } },
          take: 10,
        },
        businessTags: {
          select: { tag: { select: { id: true, name: true } } },
          take: 10,
        },
        feedbacks: {
          orderBy: { timestamp: "desc" },
          take: 10,
          select: {
            id: true,
            type: true,
            rating: true,
            text: true,
            timestamp: true,
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!business) return fail("Business not found", 404);

    return ok(business);
  } catch (error) {
    return handleApiError(error);
  }
}
