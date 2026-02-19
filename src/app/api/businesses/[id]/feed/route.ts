import { getBusinessFeed } from "@/lib/services";
import { ok, handleApiError } from "@/lib/http";
import { parsePageLimit } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { searchParams } = new URL(request.url);
    const { skip, limit, page } = parsePageLimit(searchParams.get("page"), searchParams.get("limit"));
    const { id } = await params;

    const items = await getBusinessFeed(id, skip, limit);
    return ok({ items, page, limit });
  } catch (error) {
    return handleApiError(error);
  }
}
