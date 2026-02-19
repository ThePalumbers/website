import { prisma } from "@/lib/db";

export const QUICK_REACTION_KEYS = ["useful", "funny", "cool"] as const;

export type QuickReactionKey = (typeof QUICK_REACTION_KEYS)[number];

export type QuickReactionType = {
  id: string;
  name: string;
  key: QuickReactionKey;
};

export function normalizeReactionName(name: string | null | undefined): QuickReactionKey | null {
  if (!name) return null;
  const normalized = name.trim().toLowerCase();
  if (normalized === "useful" || normalized === "funny" || normalized === "cool") return normalized;
  return null;
}

export async function getQuickReactionTypes(): Promise<QuickReactionType[]> {
  const rows = await prisma.reactionType.findMany({
    where: {
      OR: QUICK_REACTION_KEYS.map((key) => ({
        name: { equals: key, mode: "insensitive" as const },
      })),
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const byKey = new Map<QuickReactionKey, { id: string; name: string }>();
  for (const row of rows) {
    const key = normalizeReactionName(row.name);
    if (!key || byKey.has(key)) continue;
    byKey.set(key, row);
  }

  return QUICK_REACTION_KEYS.flatMap((key) => {
    const item = byKey.get(key);
    return item ? [{ id: item.id, name: item.name, key }] : [];
  });
}

