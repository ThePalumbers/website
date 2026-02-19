import { requireSessionUser } from "@/lib/auth";
import { friendshipRespondSchema } from "@/lib/validation";
import { respondToFriendRequest } from "@/lib/services";
import { ok, handleApiError, fail } from "@/lib/http";
import { pushNotification } from "@/lib/notifications-store";

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

    if (payload.action === "accept") {
      pushNotification(result.requesterId, {
        type: "friend_accept",
        title: "Friend request accepted",
        body: `${user.name ?? "Someone"} accepted your friend request`,
        href: user.name ? `/u/${encodeURIComponent(user.name)}` : "/friends",
        actorUserId: user.id,
        entityId: result.id,
      });
    }

    return ok(result);
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return fail("Friend request not found.", 404);
    }
    return handleApiError(error);
  }
}
