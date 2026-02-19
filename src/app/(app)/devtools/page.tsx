import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { DevtoolsGate } from "@/components/devtools/DevtoolsGate";

export const runtime = "nodejs";

export default async function DevtoolsPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const store = await cookies();
  const unlocked = store.get("devtools")?.value === "1";

  return <DevtoolsGate initialUnlocked={unlocked} />;
}
