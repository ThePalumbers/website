import { requireSessionUser } from "@/lib/auth";
import { hasUnread, markAllRead } from "@/lib/notifications-store";
import { ok, handleApiError } from "@/lib/http";

export const runtime = "nodejs";

export async function POST() {
  try {
    const user = await requireSessionUser();
    markAllRead(user.id);
    return ok({ ok: true, hasUnread: hasUnread(user.id) });
  } catch (error) {
    return handleApiError(error);
  }
}
