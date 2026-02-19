"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/feedback/StarRating";
import { FeedbackActions } from "@/components/feedback/FeedbackActions";

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
      <div className="flex items-center gap-4 text-sm">
        <label className="inline-flex items-center gap-2 text-muted-foreground">
          <input
            checked={type === "review"}
            onChange={() => {
              if (hasMyReview) return;
              setType("review");
              setRatingError(null);
            }}
            type="radio"
            name="type"
            disabled={hasMyReview}
          />{" "}
          <span className={hasMyReview ? "opacity-60" : undefined}>Review</span>
        </label>
        <label className="inline-flex items-center gap-2 text-muted-foreground">
          <input
            checked={type === "tip"}
            onChange={() => {
              setType("tip");
              setRating(null);
              setRatingError(null);
            }}
            type="radio"
            name="type"
          />{" "}
          Tip
        </label>
      </div>

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
