import { cookies } from "next/headers";
import { z } from "zod";
import { fail, handleApiError, ok } from "@/lib/http";

export const runtime = "nodejs";

const schema = z.object({
  token: z.string().min(1),
});

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not Found", { status: 404 });
  }

  try {
    const payload = schema.parse(await request.json());
    const expectedToken = process.env.DEVTOOLS_TOKEN;

    if (!expectedToken) {
      return fail("DEVTOOLS_TOKEN is not configured.", 500);
    }

    if (payload.token !== expectedToken) {
      return fail("Invalid devtools token.", 401);
    }

    const store = await cookies();
    store.set("devtools", "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return ok({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
