import { cookies } from "next/headers";
import { fail } from "@/lib/http";

export function isProductionEnv() {
  return process.env.NODE_ENV === "production";
}

export async function guardDevtoolsRoute() {
  if (isProductionEnv()) {
    return new Response("Not Found", { status: 404 });
  }

  const store = await cookies();
  if (store.get("devtools")?.value !== "1") {
    return fail("Devtools is locked.", 401);
  }

  return null;
}
