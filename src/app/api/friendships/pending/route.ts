import { requireSessionUser } from "@/lib/auth";
import { listPendingFriendships } from "@/lib/services";
import { ok, handleApiError } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireSessionUser();
    const pending = await listPendingFriendships(user.id);
    return ok(pending);
  } catch (error) {
    return handleApiError(error);
  }
}
