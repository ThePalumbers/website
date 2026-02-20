"use client";

import { usePathname } from "next/navigation";

export function HeaderCenterLabel({ username }: { username?: string | null }) {
  const pathname = usePathname();
  const target = pathname.startsWith("/devtools") ? "DevTools" : "Palumbers";
  const user = username?.startsWith("Fabio")? username.replaceAll("Fabio", "TheGoodFabio") : username;

  return (
    <div className="mt-1 hidden whitespace-nowrap text-sm text-foreground/80 leading-tight sm:block">
      Hi, <b>{user ?? "there"}</b>. Welcome to <b>{target}</b>.
    </div>
  );
}
