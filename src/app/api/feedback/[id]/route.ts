import { feedbackUpdatePayloadSchema } from "@/lib/validation";
import { fail, handleApiError, ok } from "@/lib/http";
import { requireSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSessionUser();
    const payload = feedbackUpdatePayloadSchema.parse(await request.json());
    const { id } = await params;

    const feedback = await prisma.feedback.findUnique({
      where: { id },
      select: { id: true, userId: true, type: true, rating: true, text: true, businessId: true },
    });

    if (!feedback) return fail("Feedback not found.", 404);
    if (feedback.userId !== user.id) return fail("You can only edit/delete your own feedback.", 403);

    if (feedback.type === "review" && payload.rating == null) {
      return fail("Review requires rating.", 400);
    }

    if (feedback.type === "tip" && payload.rating != null) {
      return fail("Tip must have null rating.", 400);
    }

    const updated = await prisma.feedback.update({
      where: { id: feedback.id },
      data: {
        text: payload.text ?? feedback.text,
        rating: feedback.type === "review" ? payload.rating : null,
        timestamp: new Date(),
      },
      select: {
        id: true,
        userId: true,
        businessId: true,
        type: true,
        rating: true,
        text: true,
        timestamp: true,
      },
    });

    return ok({
      message: "Feedback updated.",
      feedback: updated,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSessionUser();
    const { id } = await params;

    const feedback = await prisma.feedback.findUnique({
      where: { id },
      select: { id: true, userId: true, businessId: true },
    });

    if (!feedback) return fail("Feedback not found.", 404);
    if (feedback.userId !== user.id) return fail("You can only edit/delete your own feedback.", 403);

    await prisma.feedback.delete({
      where: { id: feedback.id },
    });

    return ok({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

