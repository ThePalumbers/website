"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FeedbackForm({ businessId }: { businessId: string }) {
  const [type, setType] = useState<"review" | "tip">("review");
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        businessId,
        text,
        rating: type === "review" ? rating : null,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Unable to publish.");
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
          <input checked={type === "review"} onChange={() => setType("review")} type="radio" name="type" /> Review
        </label>
        <label className="inline-flex items-center gap-2 text-muted-foreground">
          <input checked={type === "tip"} onChange={() => setType("tip")} type="radio" name="type" /> Tip
        </label>
      </div>

      {type === "review" ? (
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Rating (1-5)</label>
          <Input type="number" min={1} max={5} value={rating} onChange={(e) => setRating(Number(e.target.value))} />
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
