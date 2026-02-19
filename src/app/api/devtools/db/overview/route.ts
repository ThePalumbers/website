import { prisma } from "@/lib/db";
import { guardDevtoolsRoute } from "@/lib/devtools";
import { handleApiError, ok } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  const guard = await guardDevtoolsRoute();
  if (guard) return guard;

  try {
    const [users, businesses, feedbacks, friendships, reactions, photos, checkins, topRaw, latestFeedback] =
      await prisma.$transaction([
        prisma.user.count(),
        prisma.business.count(),
        prisma.feedback.count(),
        prisma.friendship.count(),
        prisma.reaction.count(),
        prisma.photo.count(),
        prisma.checkin.count(),
        prisma.feedback.groupBy({
          by: ["businessId"],
          where: { rating: { not: null } },
          _avg: { rating: true },
          _count: true,
          orderBy: { _avg: { rating: "desc" } },
          take: 5,
        }),
        prisma.feedback.findMany({
          orderBy: { timestamp: "desc" },
          take: 10,
          select: {
            id: true,
            type: true,
            rating: true,
            timestamp: true,
            user: { select: { id: true, name: true } },
            business: { select: { id: true, name: true } },
          },
        }),
      ]);

    const topIds = topRaw.map((item) => item.businessId);
    const topBusinessesMap = new Map<string, { id: string; name: string; city: string; state: string }>();

    if (topIds.length) {
      const topBusinesses = await prisma.business.findMany({
        where: { id: { in: topIds } },
        select: { id: true, name: true, city: true, state: true },
      });
      topBusinesses.forEach((b) => topBusinessesMap.set(b.id, b));
    }

    const top = topRaw
      .map((item) => {
        const business = topBusinessesMap.get(item.businessId);
        if (!business) return null;

        return {
          businessId: business.id,
          name: business.name,
          city: business.city,
          state: business.state,
          avgRating: item._avg?.rating ?? 0,
          feedbackCount: typeof item._count === 'object' ? item._count._all ?? 0 : 0,
        };
      })
      .filter(
        (item): item is {
          businessId: string;
          name: string;
          city: string;
          state: string;
          avgRating: number;
          feedbackCount: number;
        } => item !== null,
      );

    return ok({
      counts: { users, businesses, feedbacks, friendships, reactions, photos, checkins },
      topBusinesses: top,
      latestFeedback,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
