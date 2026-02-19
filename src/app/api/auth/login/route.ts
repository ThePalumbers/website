import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { fail, ok, handleApiError } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = loginSchema.parse(await request.json());

    const account = await prisma.appAccount.findUnique({
      where: { email: payload.email },
      include: { user: true },
    });

    if (!account) return fail("Invalid credentials.", 401);

    const isValid = await bcrypt.compare(payload.password, account.passwordHash);
    if (!isValid) return fail("Invalid credentials.", 401);

    await createSession(account.userId);
    return ok({ id: account.user.id, name: account.user.name });
  } catch (error) {
    return handleApiError(error);
  }
}
