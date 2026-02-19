import { clearSession } from "@/lib/auth";
import { handleApiError } from "@/lib/http";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await clearSession();
    return NextResponse.redirect(new URL("/auth/login", request.url));
  } catch (error) {
    return handleApiError(error);
  }
}
