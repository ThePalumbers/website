import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, { status: 200, ...init });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return fail(error.issues[0]?.message ?? "Invalid payload", 400);
  }

  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return fail("Please login first.", 401);
  }

  return fail("Something went wrong. Please retry.", 500);
}
