"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

export function BrandLogo() {
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const src = mounted && resolvedTheme === "dark" ? "/brand/nobckg-white.png" : "/brand/nobckg-9.png";

  return (
    <Image
      src={src}
      alt="Palumbers logo"
      width={84}
      height={84}
      priority
      draggable={false}
      className="h-[84px] w-[84px] select-none object-contain"
    />
  );
}
