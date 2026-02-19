import { listBusinesses } from "@/lib/services";
import { ok, handleApiError } from "@/lib/http";
import { parsePageLimit } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit } = parsePageLimit(searchParams.get("page"), searchParams.get("limit"));

    const results = await listBusinesses({
      query: searchParams.get("query") ?? undefined,
      city: searchParams.get("city") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      tag: searchParams.get("tag") ?? undefined,
      openNow: searchParams.get("openNow") === "true",
      minRating: searchParams.get("minRating") ? Number(searchParams.get("minRating")) : undefined,
    });

    const start = (page - 1) * limit;
    return ok({
      items: results.slice(start, start + limit),
      page,
      limit,
      total: results.length,
      totalPages: Math.max(1, Math.ceil(results.length / limit)),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
