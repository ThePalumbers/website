import { z } from "zod";
import { prisma } from "@/lib/db";
import { guardDevtoolsRoute } from "@/lib/devtools";
import { fail, handleApiError, ok } from "@/lib/http";

export const runtime = "nodejs";

const paramsSchema = z.object({
  usernameOrId: z.string().trim().min(1).max(64),
});

export async function GET(_: Request, { params }: { params: Promise<{ usernameOrId: string }> }) {
  const guard = await guardDevtoolsRoute();
  if (guard) return guard;

  try {
    const parsed = paramsSchema.parse(await params);

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: parsed.usernameOrId },
          { name: { equals: parsed.usernameOrId, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, registrationDate: true },
    });

    if (!user) return fail("User not found", 404);

    const [friendsCount, latestFeedback] = await prisma.$transaction([
      prisma.friendship.count({
        where: {
          status: "accepted",
          OR: [{ requesterId: user.id }, { addresseeId: user.id }],
        },
      }),
      prisma.feedback.findMany({
        where: { userId: user.id },
        orderBy: { timestamp: "desc" },
        take: 10,
        select: {
          id: true,
          type: true,
          rating: true,
          text: true,
          timestamp: true,
          business: { select: { id: true, name: true, city: true, state: true } },
        },
      }),
    ]);

    return ok({ user, friendsCount, latestFeedback });
  } catch (error) {
    return handleApiError(error);
  }
}
