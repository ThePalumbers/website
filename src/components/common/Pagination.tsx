import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Pagination({
  basePath,
  page,
  totalPages,
  limit,
  query,
}: {
  basePath: string;
  page: number;
  totalPages: number;
  limit: number;
  query?: Record<string, string>;
}) {
  const prev = Math.max(1, page - 1);
  const next = Math.min(totalPages, page + 1);

  const makeHref = (targetPage: number) => {
    const params = new URLSearchParams({ ...(query ?? {}), page: String(targetPage), limit: String(limit) });
    return `${basePath}?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-end gap-2 pt-2">
      <span className="mr-1 text-xs text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      <Link
        href={makeHref(prev)}
        aria-disabled={page <= 1}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), page <= 1 && "pointer-events-none opacity-50")}
      >
        Prev
      </Link>
      <Link
        href={makeHref(next)}
        aria-disabled={page >= totalPages}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          page >= totalPages && "pointer-events-none opacity-50",
        )}
      >
        Next
      </Link>
    </div>
  );
}
