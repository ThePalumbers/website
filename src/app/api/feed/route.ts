import { requireSessionUser } from "@/lib/auth";
import { getFriendFeed } from "@/lib/services";
import { parsePageLimit } from "@/lib/utils";
import { ok, handleApiError } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePageLimit(searchParams.get("page"), searchParams.get("limit"));

    const items = await getFriendFeed(user.id, skip, limit);
    return ok({ items, page, limit });
  } catch (error) {
    return handleApiError(error);
  }
}
