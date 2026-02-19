import { reactionPayloadSchema } from "@/lib/validation";
import { upsertReaction } from "@/lib/services";
import { fail, ok, handleApiError } from "@/lib/http";
import { requireSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { normalizeReactionName, type QuickReactionKey } from "@/lib/quick-reactions";
import { publishReactionEvent } from "@/lib/reactions-realtime";

export const runtime = "nodejs";

async function getReactionCounts(feedbackId: string): Promise<Record<QuickReactionKey, number>> {
  const counts: Record<QuickReactionKey, number> = { useful: 0, funny: 0, cool: 0 };

  const rows = await prisma.reaction.findMany({
    where: { feedbackId },
    select: { reactionType: { select: { name: true } } },
  });

  for (const row of rows) {
    const key = normalizeReactionName(row.reactionType?.name);
    if (!key) continue;
    counts[key] += 1;
  }

  return counts;
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const payload = reactionPayloadSchema.parse(await request.json());
    const feedback = await prisma.feedback.findUnique({
      where: { id: payload.feedbackId },
      select: { userId: true, businessId: true },
    });

    if (!feedback) {
      return fail("Feedback not found.", 404);
    }

    if (feedback.userId === user.id) {
      return fail("You can't react to your own feedback.", 403);
    }

    const existing = await prisma.reaction.findUnique({
      where: {
        userId_feedbackId: {
          userId: user.id,
          feedbackId: payload.feedbackId,
        },
      },
      select: { id: true, reactionTypeId: true },
    });

    if (existing && existing.reactionTypeId === payload.reactionTypeId) {
      await prisma.reaction.delete({
        where: {
          userId_feedbackId: {
            userId: user.id,
            feedbackId: payload.feedbackId,
          },
        },
      });

      const counts = await getReactionCounts(payload.feedbackId);
      const eventPayload = {
        feedbackId: payload.feedbackId,
        businessId: feedback.businessId ?? undefined,
        myReaction: null,
        kind: "deleted" as const,
        counts,
        ts: new Date().toISOString(),
      };

      publishReactionEvent(eventPayload);
      return ok({ status: "deleted", myReactionTypeId: null });
    }

    const reaction = await upsertReaction({ ...payload, userId: user.id });
    const counts = await getReactionCounts(payload.feedbackId);
    const eventPayload = {
      feedbackId: payload.feedbackId,
      businessId: feedback.businessId ?? undefined,
      myReaction: reaction.reactionTypeId,
      kind: "upserted" as const,
      counts,
      ts: new Date().toISOString(),
    };

    publishReactionEvent(eventPayload);
    return ok({ status: "upserted", myReactionTypeId: reaction.reactionTypeId }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
