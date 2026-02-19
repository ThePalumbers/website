import { requireSessionUser } from "@/lib/auth";
import { friendshipRespondSchema } from "@/lib/validation";
import { respondToFriendRequest } from "@/lib/services";
import { ok, handleApiError, fail } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const payload = friendshipRespondSchema.parse(await request.json());

    const result = await respondToFriendRequest({
      requestId: payload.requestId,
      action: payload.action,
      currentUserId: user.id,
    });

    return ok(result);
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return fail("Friend request not found.", 404);
    }
    return handleApiError(error);
  }
}
