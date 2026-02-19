import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { id22 } from "@/lib/id";
import { signupSchema } from "@/lib/validation";
import { fail, ok, handleApiError } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = signupSchema.parse(await request.json());

    const existing = await prisma.appAccount.findUnique({ where: { email: payload.email } });
    if (existing) return fail("Email already in use.", 409);

    const user = await prisma.user.create({
      data: {
        id: id22(),
        name: payload.name,
      },
    });

    const passwordHash = await bcrypt.hash(payload.password, 12);

    await prisma.appAccount.create({
      data: {
        userId: user.id,
        email: payload.email,
        passwordHash,
      },
    });

    await createSession(user.id);
    return ok({ id: user.id, name: user.name });
  } catch (error) {
    return handleApiError(error);
  }
}
