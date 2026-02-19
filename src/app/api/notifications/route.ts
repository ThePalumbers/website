import { z } from "zod";
import { requireSessionUser } from "@/lib/auth";
import { fail, ok, handleApiError } from "@/lib/http";
import { hasUnread, listNotifications } from "@/lib/notifications-store";

export const runtime = "nodejs";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const { searchParams } = new URL(request.url);
    const query = querySchema.safeParse({
      limit: searchParams.get("limit") ?? undefined,
    });

    if (!query.success) {
      return fail("Invalid query params.", 400);
    }

    const limit = query.data.limit ?? 20;
    const items = listNotifications(user.id, limit);
    return ok({
      items,
      hasUnread: hasUnread(user.id),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
