import { getUserProfile } from "@/lib/services";
import { fail, ok, handleApiError } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params;
    const profile = await getUserProfile(username);

    if (!profile) return fail("User not found", 404);
    return ok(profile);
  } catch (error) {
    return handleApiError(error);
  }
}
