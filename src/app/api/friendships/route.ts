import { requireSessionUser } from "@/lib/auth";
import { listAcceptedFriends } from "@/lib/services";
import { ok, handleApiError } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireSessionUser();
    const friends = await listAcceptedFriends(user.id);
    return ok({ items: friends });
  } catch (error) {
    return handleApiError(error);
  }
}
