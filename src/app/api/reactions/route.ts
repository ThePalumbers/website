import { reactionPayloadSchema } from "@/lib/validation";
import { upsertReaction } from "@/lib/services";
import { ok, handleApiError } from "@/lib/http";
import { requireSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const payload = reactionPayloadSchema.parse(await request.json());

    const reaction = await upsertReaction({ ...payload, userId: user.id });
    return ok(reaction, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
