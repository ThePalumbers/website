import { requireSessionUser } from "@/lib/auth";
import { friendshipRequestSchema } from "@/lib/validation";
import { sendFriendRequest } from "@/lib/services";
import { ok, handleApiError, fail } from "@/lib/http";
import { pushNotification } from "@/lib/notifications-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const payload = friendshipRequestSchema.parse(await request.json());

    if (payload.toUserId === user.id) {
      return fail("You cannot add yourself.", 400);
    }

    const result = await sendFriendRequest(user.id, payload.toUserId);
    pushNotification(payload.toUserId, {
      type: "friend_request",
      title: "New friend request",
      body: `${user.name ?? "Someone"} sent you a friend request`,
      href: "/friends?tab=incoming",
      actorUserId: user.id,
      entityId: result.id,
    });

    return ok(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
