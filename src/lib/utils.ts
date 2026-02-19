import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function parsePageLimit(
  pageRaw: string | null,
  limitRaw: string | null,
  defaultLimit = 12,
) {
  const page = Number.parseInt(pageRaw ?? "1", 10);
  const limit = Number.parseInt(limitRaw ?? String(defaultLimit), 10);
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safeLimit = clamp(Number.isFinite(limit) ? limit : defaultLimit, 1, 50);

  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
  };
}

export function formatAddress(input: {
  street?: string | null;
  city: string;
  state: string;
  postalCode?: string | null;
}) {
  return [input.street, `${input.city}, ${input.state}`, input.postalCode]
    .filter(Boolean)
    .join(" ");
}

export function formatStars(rating: number | null) {
  if (!rating) return "No ratings";
  return `${rating.toFixed(1)} / 5`;
}
