import { feedbackPayloadSchema } from "@/lib/validation";
import { createFeedback } from "@/lib/services";
import { fail, ok, handleApiError } from "@/lib/http";
import { requireSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const payload = feedbackPayloadSchema.parse(await request.json());

    if (payload.type === "review") {
      const existing = await prisma.feedback.findFirst({
        where: {
          userId: user.id,
          businessId: payload.businessId,
          type: "review",
        },
        select: { id: true },
      });

      if (existing) {
        return fail("You already reviewed this business. You can edit your review instead.", 409);
      }
    }

    const created = await createFeedback({ ...payload, userId: user.id });
    return ok(created, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
