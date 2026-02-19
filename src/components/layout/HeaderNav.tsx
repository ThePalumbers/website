"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

export function HeaderNav({ username }: { username?: string }) {
  const pathname = usePathname();

  const nav = [
    { href: "/explore", label: "Explore" },
    { href: "/feed", label: "Feed" },
    { href: "/friends", label: "Friends" },
  ];

  return (
    <nav className="flex items-center gap-1.5 text-base">
      {nav.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            draggable={false}
            className={cn(
              "px-2.5 py-2 transition-colors",
              active
                ? "text-brand underline underline-offset-4 decoration-brand/70"
                : "text-muted-foreground hover:text-brand/60",
            )}
          >
            {item.label}
          </Link>
        );
      })}

      <ThemeToggle />

      {username ? (
        <>
          <Link href={`/u/${encodeURIComponent(username)}`} aria-label="Profile" title="Profile" draggable={false}>
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                "h-8 w-8 px-0",
                pathname.startsWith("/u/") ? "text-brand" : "text-muted-foreground hover:text-brand/60",
              )}
            >
              <User className="h-4 w-4" />
              <span className="sr-only">Profile</span>
            </Button>
          </Link>
          <form action="/api/auth/logout" method="post">
            <Button
              size="sm"
              variant="ghost"
              type="submit"
              aria-label="Logout"
              title="Logout"
              className="h-8 w-8 px-0 text-muted-foreground hover:text-brand/60"
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Logout</span>
            </Button>
          </form>
        </>
      ) : (
        <Link href="/auth/login" aria-label="Login or signup" draggable={false}>
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              "w-8 px-0",
              pathname.startsWith("/auth") ? "text-brand" : "text-muted-foreground hover:text-brand/60",
            )}
          >
            <User className="h-4 w-4" />
          </Button>
        </Link>
      )}
    </nav>
  );
}
