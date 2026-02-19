import { randomUUID } from "crypto";

export type AppNotification = {
  id: string;
  type: "friend_request" | "friend_accept" | "reaction";
  title: string;
  body?: string;
  href: string;
  createdAt: string;
  read: boolean;
  actorUserId?: string;
  entityId?: string;
};

type NotificationStore = {
  byUser: Map<string, AppNotification[]>;
  subs: Map<string, Set<(n: AppNotification) => void>>;
};

function getStore(): NotificationStore {
  const globalState = globalThis as typeof globalThis & {
    __notifStore__?: NotificationStore;
  };

  if (!globalState.__notifStore__) {
    globalState.__notifStore__ = {
      byUser: new Map(),
      subs: new Map(),
    };
  }

  return globalState.__notifStore__;
}

export function pushNotification(
  userId: string,
  n: Omit<AppNotification, "id" | "createdAt" | "read">,
): AppNotification {
  const store = getStore();
  const current = store.byUser.get(userId) ?? [];
  const notification: AppNotification = {
    ...n,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    read: false,
  };

  const next = [notification, ...current].slice(0, 50);
  store.byUser.set(userId, next);

  const subscribers = store.subs.get(userId);
  if (subscribers) {
    subscribers.forEach((cb) => cb(notification));
  }

  return notification;
}

export function listNotifications(userId: string, limit = 20): AppNotification[] {
  const store = getStore();
  const safeLimit = Math.max(1, Math.min(50, limit));
  const current = store.byUser.get(userId) ?? [];
  return current.slice(0, safeLimit);
}

export function hasUnread(userId: string): boolean {
  const store = getStore();
  const current = store.byUser.get(userId) ?? [];
  return current.some((n) => !n.read);
}

export function markAllRead(userId: string): void {
  const store = getStore();
  const current = store.byUser.get(userId) ?? [];
  if (!current.length) return;
  store.byUser.set(
    userId,
    current.map((n) => ({ ...n, read: true })),
  );
}

export function markRead(userId: string, notificationId: string): void {
  const store = getStore();
  const current = store.byUser.get(userId) ?? [];
  if (!current.length) return;
  store.byUser.set(
    userId,
    current.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
  );
}

export function subscribe(userId: string, cb: (n: AppNotification) => void): () => void {
  const store = getStore();
  const subsForUser = store.subs.get(userId) ?? new Set();
  subsForUser.add(cb);
  store.subs.set(userId, subsForUser);

  return () => {
    const latest = store.subs.get(userId);
    if (!latest) return;
    latest.delete(cb);
    if (!latest.size) {
      store.subs.delete(userId);
    }
  };
}
