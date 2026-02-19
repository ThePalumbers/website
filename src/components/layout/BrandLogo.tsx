"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type LogoSize = "sm" | "md" | "lg" | number;

export function BrandLogo({ isLoggedIn = false, size = "md" }: { isLoggedIn?: boolean; size?: LogoSize }) {
  const { resolvedTheme, theme, systemTheme } = useTheme();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDevtools = pathname?.startsWith("/devtools");
  const effectiveTheme = theme === "system" ? systemTheme : theme;
  const isDark = (resolvedTheme ?? effectiveTheme) === "dark";
  const src = !mounted
    ? "/brand/nobckg-white.png"
    : isLoggedIn && (isDevtools || isDark)
      ? "/brand/nobckg-9.png"
      : isDark
        ? "/brand/nobckg-white.png"
        : "/brand/nobckg-9.png";

  const pxSize = typeof size === "number" ? size : size === "sm" ? 32 : size === "lg" ? 48 : 44;

  return (
    <Image
      src={src}
      alt="Palumbers logo"
      width={pxSize}
      height={pxSize}
      priority
      draggable={false}
      className="select-none object-contain"
    />
  );
}
