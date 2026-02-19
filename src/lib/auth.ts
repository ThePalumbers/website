import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";

const SESSION_COOKIE = "palumbers_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14;

function makeToken() {
  return randomBytes(32).toString("hex");
}

export async function createSession(userId: string) {
  const token = makeToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.appSession.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.appSession.deleteMany({ where: { token } });
  }

  store.delete(SESSION_COOKIE);
}

export async function getSessionUser() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  const session = await prisma.appSession.findUnique({
    where: { token },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.appSession.delete({ where: { id: session.id } });
    store.delete(SESSION_COOKIE);
    return null;
  }

  return session.user;
}

export async function requireSessionUser() {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}
