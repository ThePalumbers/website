import { listBusinessesPage } from "@/lib/services";
import { ok, handleApiError } from "@/lib/http";
import { parsePageLimit } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit } = parsePageLimit(searchParams.get("page"), searchParams.get("limit"));

    const result = await listBusinessesPage(
      {
        query: searchParams.get("query") ?? undefined,
        city: searchParams.get("city") ?? undefined,
        category: searchParams.get("category") ?? undefined,
        tag: searchParams.get("tag") ?? undefined,
        openNow: searchParams.get("openNow") === "true",
        minRating: searchParams.get("minRating") ? Number(searchParams.get("minRating")) : undefined,
      },
      page,
      limit,
    );
    return ok({
      items: result.items,
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
