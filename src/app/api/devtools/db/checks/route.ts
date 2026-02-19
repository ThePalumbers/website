import { prisma } from "@/lib/db";
import { guardDevtoolsRoute } from "@/lib/devtools";
import { handleApiError, ok } from "@/lib/http";

export const runtime = "nodejs";

type CountRow = { count: number };

export async function GET() {
  const guard = await guardDevtoolsRoute();
  if (guard) return guard;

  try {
    const [reviewWithoutRating, tipWithRating, duplicateReactions, invalidSelfFriendships, invalidStatus] =
      await prisma.$transaction([
        prisma.feedback.count({ where: { type: "review", rating: null } }),
        prisma.feedback.count({ where: { type: "tip", rating: { not: null } } }),
        prisma.$queryRaw<CountRow[]>`
          SELECT COUNT(*)::int AS count
          FROM (
            SELECT "UserId", "FeedbackId", COUNT(*) AS n
            FROM "REACTIONS"
            GROUP BY "UserId", "FeedbackId"
            HAVING COUNT(*) > 1
          ) duplicated
        `,
        prisma.$queryRaw<CountRow[]>`
          SELECT COUNT(*)::int AS count
          FROM "FRIENDSHIPS"
          WHERE "requester_id" = "addressee_id"
        `,
        prisma.$queryRaw<CountRow[]>`
          SELECT COUNT(*)::int AS count
          FROM "FRIENDSHIPS"
          WHERE "status"::text NOT IN ('pending','accepted','rejected')
        `,
      ]);

    const checks = [
      {
        key: "feedback_review_requires_rating",
        title: "FEEDBACK review => rating NOT NULL",
        violations: reviewWithoutRating,
      },
      {
        key: "feedback_tip_requires_null_rating",
        title: "FEEDBACK tip => rating IS NULL",
        violations: tipWithRating,
      },
      {
        key: "reactions_unique_user_feedback",
        title: "REACTIONS unique (userId, feedbackId)",
        violations: duplicateReactions[0]?.count ?? 0,
      },
      {
        key: "friendships_no_self_reference",
        title: "FRIENDSHIPS requesterId != addresseeId",
        violations: invalidSelfFriendships[0]?.count ?? 0,
      },
      {
        key: "friendships_valid_status",
        title: "FRIENDSHIPS status in pending|accepted|rejected",
        violations: invalidStatus[0]?.count ?? 0,
      },
    ].map((item) => ({ ...item, pass: item.violations === 0 }));

    return ok({ checks });
  } catch (error) {
    return handleApiError(error);
  }
}
