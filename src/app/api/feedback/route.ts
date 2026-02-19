import { feedbackPayloadSchema } from "@/lib/validation";
import { createFeedback } from "@/lib/services";
import { ok, handleApiError } from "@/lib/http";
import { requireSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const payload = feedbackPayloadSchema.parse(await request.json());

    const created = await createFeedback({ ...payload, userId: user.id });
    return ok(created, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
