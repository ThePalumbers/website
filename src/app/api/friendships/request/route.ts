import { requireSessionUser } from "@/lib/auth";
import { friendshipRequestSchema } from "@/lib/validation";
import { sendFriendRequest } from "@/lib/services";
import { ok, handleApiError, fail } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const payload = friendshipRequestSchema.parse(await request.json());

    if (payload.toUserId === user.id) {
      return fail("You cannot add yourself.", 400);
    }

    const result = await sendFriendRequest(user.id, payload.toUserId);
    return ok(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
