import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRatingDisplay({ rating, className }: { rating: number; className?: string }) {
  return (
    <div className={cn("inline-flex items-center gap-1", className)} aria-label={`Rating ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= rating;
        return (
          <Star
            key={star}
            className={cn("h-4 w-4", active ? "fill-[#DE0F3F]/80 text-[#DE0F3F]/80" : "text-muted-foreground/40")}
          />
        );
      })}
    </div>
  );
}

