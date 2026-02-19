"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type NotificationItem = {
  id: string;
  type: "friend_request" | "friend_accept" | "reaction";
  title: string;
  body?: string;
  href: string;
  createdAt: string;
  read: boolean;
};

export function HeaderNav({ username, isLoggedIn = false }: { username?: string | null; isLoggedIn?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [loadingNotif, setLoadingNotif] = useState(false);

  const nav = [
    { href: "/explore", label: "Explore" },
    { href: "/feed", label: "Feed" },
    { href: "/friends", label: "Friends" },
  ];

  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;

    async function loadInitial() {
      setLoadingNotif(true);
      const res = await fetch("/api/notifications?limit=10", { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as {
        items?: NotificationItem[];
        hasUnread?: boolean;
      };
      if (!cancelled && res.ok) {
        setNotifications(data.items ?? []);
        setHasUnread(Boolean(data.hasUnread));
      }
      if (!cancelled) {
        setLoadingNotif(false);
      }
    }

    loadInitial();

    const es = new EventSource("/api/realtime/notifications");
    es.addEventListener("notification", (event) => {
      const msg = event as MessageEvent<string>;
      try {
        const data = JSON.parse(msg.data) as {
          notification?: NotificationItem;
          hasUnread?: boolean;
        };
        if (!data.notification) return;
        setNotifications((prev) => [data.notification!, ...prev.filter((n) => n.id !== data.notification!.id)].slice(0, 10));
        setHasUnread(Boolean(data.hasUnread ?? true));
      } catch {
        // ignore malformed messages
      }
    });

    return () => {
      cancelled = true;
      es.close();
    };
  }, [isLoggedIn]);

  const profileHref = useMemo(
    () => (username ? `/u/${encodeURIComponent(username)}` : "/auth/login"),
    [username],
  );

  async function markAllNotificationsRead() {
    const res = await fetch("/api/notifications/mark-all-read", {
      method: "POST",
    });
    if (!res.ok) return;
    const data = (await res.json().catch(() => ({}))) as { hasUnread?: boolean };
    setHasUnread(Boolean(data.hasUnread));
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  }

  async function openNotification(item: NotificationItem) {
    const res = await fetch("/api/notifications/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id }),
    });
    const data = (await res.json().catch(() => ({}))) as { hasUnread?: boolean };
    setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
    if (res.ok) {
      setHasUnread(Boolean(data.hasUnread));
    }
    router.push(item.href);
    router.refresh();
  }

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

      {isLoggedIn ? (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                aria-label="Notifications"
                title="Notifications"
                className="relative h-8 w-8 px-0 text-muted-foreground hover:text-brand/60"
              >
                <Bell className="h-4 w-4" />
                {hasUnread ? <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#DE0F3F]/80" /> : null}
                <span className="sr-only">Notifications</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[320px]">
              <div className="flex items-center justify-between px-2 py-1.5">
                <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={markAllNotificationsRead}>
                  Mark all as read
                </Button>
              </div>
              <DropdownMenuSeparator />
              {loadingNotif ? (
                <div className="px-2 py-4 text-xs text-muted-foreground">Loading...</div>
              ) : notifications.length ? (
                notifications.map((item) => (
                  <DropdownMenuItem
                    key={item.id}
                    className="flex cursor-pointer flex-col items-start gap-0.5"
                    onSelect={(e) => {
                      e.preventDefault();
                      void openNotification(item);
                    }}
                  >
                    <span className={cn("text-sm", item.read ? "text-foreground/80" : "font-medium text-foreground")}>
                      {item.title}
                    </span>
                    {item.body ? <span className="line-clamp-2 text-xs text-muted-foreground">{item.body}</span> : null}
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="px-2 py-4 text-xs text-muted-foreground">No notifications yet.</div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href={profileHref} aria-label="Profile" title="Profile" draggable={false}>
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
