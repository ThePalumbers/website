import { getBusinessById } from "@/lib/services";
import { fail, ok, handleApiError } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const business = await getBusinessById(id);
    if (!business) return fail("Business not found", 404);
    return ok(business);
  } catch (error) {
    return handleApiError(error);
  }
}
