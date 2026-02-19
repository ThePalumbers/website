import { requireSessionUser } from "@/lib/auth";
import { ok, handleApiError } from "@/lib/http";
import { hasUnread, markRead } from "@/lib/notifications-store";
import { notificationMarkReadSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const payload = notificationMarkReadSchema.parse(await request.json());
    markRead(user.id, payload.id);
    return ok({ ok: true, hasUnread: hasUnread(user.id) });
  } catch (error) {
    return handleApiError(error);
  }
}
