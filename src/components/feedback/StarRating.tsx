"use client";

import { type KeyboardEvent, useMemo, useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type StarRatingProps = {
  value: number | null;
  onChange: (v: number) => void;
  size?: "sm" | "md";
  disabled?: boolean;
};

export function StarRating({ value, onChange, size = "md", disabled = false }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const activeValue = hoverValue ?? value ?? 0;
  const iconClass = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  const stars = useMemo(() => [1, 2, 3, 4, 5], []);

  function handleKeyDown(current: number, e: KeyboardEvent<HTMLButtonElement>) {
    const { key } = e;
    if (disabled) return;
    if (key === "ArrowRight" || key === "ArrowUp") {
      e.preventDefault();
      onChange(Math.min(5, (value ?? current) + 1));
    }
    if (key === "ArrowLeft" || key === "ArrowDown") {
      e.preventDefault();
      onChange(Math.max(1, (value ?? current) - 1));
    }
    if (key === "Home") {
      e.preventDefault();
      onChange(1);
    }
    if (key === "End") {
      e.preventDefault();
      onChange(5);
    }
    if (/^[1-5]$/.test(key)) {
      e.preventDefault();
      onChange(Number(key));
    }
  }

  return (
    <div className="space-y-1">
      <div
        role="radiogroup"
        aria-label="Rating"
        className={cn("inline-flex items-center gap-1 rounded-md border border-border/60 bg-card/60 px-2 py-1")}
      >
        {stars.map((star) => {
          const isActive = star <= activeValue;
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={value === star}
              aria-label={`${star} out of 5`}
              disabled={disabled}
              onMouseEnter={() => !disabled && setHoverValue(star)}
              onMouseLeave={() => !disabled && setHoverValue(null)}
              onFocus={() => !disabled && setHoverValue(star)}
              onBlur={() => !disabled && setHoverValue(null)}
              onClick={() => !disabled && onChange(star)}
              onKeyDown={(e) => handleKeyDown(star, e)}
              className="rounded-sm p-0.5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#DE0F3F]/40 disabled:opacity-60"
            >
              <Star
                className={cn(
                  iconClass,
                  "transition-colors duration-150",
                  isActive ? "fill-[#DE0F3F] text-[#DE0F3F]" : "text-muted-foreground/70 hover:text-[#DE0F3F]/60",
                )}
              />
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">{value ? `${value}/5` : "Select rating"}</p>
    </div>
  );
}
