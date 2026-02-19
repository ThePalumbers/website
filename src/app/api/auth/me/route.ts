import { getSessionUser } from "@/lib/auth";
import { ok, handleApiError } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getSessionUser();
    return ok({ user });
  } catch (error) {
    return handleApiError(error);
  }
}
