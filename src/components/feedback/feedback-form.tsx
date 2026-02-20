"use client";

import { useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/feedback/StarRating";
import { FeedbackActions } from "@/components/feedback/FeedbackActions";
import { cn } from "@/lib/utils";

type ExistingReview = {
  id: string;
  userId: string;
  businessId: string;
  type: "review" | "tip";
  text: string | null;
  rating: number | null;
};

export function FeedbackForm({
  businessId,
  currentUserId,
  existingReview,
}: {
  businessId: string;
  currentUserId: string;
  existingReview?: ExistingReview | null;
}) {
  const [type, setType] = useState<"review" | "tip">(existingReview ? "tip" : "review");
  const [text, setText] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const hasMyReview = Boolean(existingReview?.id);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setRatingError(null);

    if (type === "review" && hasMyReview) {
      setMessage("You already reviewed this business. You can edit your review instead.");
      return;
    }

    if (type === "review" && rating == null) {
      setRatingError("Please select a star rating before publishing your review.");
      return;
    }

    const payload: Record<string, unknown> = {
      type,
      businessId,
      text,
    };
    if (type === "review") payload.rating = rating;

    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      if (res.status === 409) {
        setMessage("You already reviewed this business. You can edit your review instead.");
      } else {
        setMessage(data.error ?? "Unable to publish.");
      }
      return;
    }

    setText("");
    setMessage("Published.");
    window.location.reload();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border bg-card p-4 shadow-sm">
      <h3 className="text-sm font-medium">Write feedback</h3>
      <Tabs.Root
        value={type}
        onValueChange={(value) => {
          const next = value === "tip" ? "tip" : "review";
          if (next === "review" && hasMyReview) return;
          setType(next);
          setRatingError(null);
          if (next === "tip") {
            setRating(null);
          }
        }}
      >
        <Tabs.List
          className={cn(
            "relative inline-grid h-10 w-52 grid-cols-2 items-center rounded-full border bg-background/40 p-1 shadow-sm backdrop-blur",
          )}
          aria-label="Feedback type"
        >
          <motion.div
            aria-hidden
            className="absolute bottom-1 top-1 left-1 rounded-full bg-foreground/10"
            style={{ width: "calc(50% - 4px)" }}
            animate={{ x: type === "review" ? 0 : "100%" }}
            transition={{ type: "spring", stiffness: 500, damping: 40 }}
          />
          <Tabs.Trigger
            value="review"
            disabled={hasMyReview}
            className={cn(
              "relative z-10 rounded-full px-4 text-sm outline-none transition-colors",
              "text-foreground/70 data-[state=active]:text-foreground",
              "disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            Review
          </Tabs.Trigger>
          <Tabs.Trigger
            value="tip"
            className={cn(
              "relative z-10 rounded-full px-4 text-sm outline-none transition-colors",
              "text-foreground/70 data-[state=active]:text-foreground",
            )}
          >
            Tip
          </Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root>

      {hasMyReview ? (
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">You already reviewed this business. Edit your review instead.</p>
          {existingReview ? <FeedbackActions feedback={existingReview} currentUserId={currentUserId} mode="editOnly" /> : null}
        </div>
      ) : null}

      {type === "review" ? (
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Rating</label>
          <StarRating value={rating} onChange={(v) => setRating(v)} />
          {ratingError ? <p className="text-xs text-destructive">{ratingError}</p> : null}
        </div>
      ) : null}

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Text</label>
        <textarea
          required
          className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit">Publish</Button>
        {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
      </div>
    </form>
  );
}
