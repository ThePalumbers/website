"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type ReactionType = { id: string; name: string };

export function ReactionPicker({ feedbackId, reactionTypes }: { feedbackId: string; reactionTypes: ReactionType[] }) {
  const [message, setMessage] = useState<string | null>(null);

  async function react(reactionTypeId: string) {
    setMessage(null);
    const res = await fetch("/api/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedbackId, reactionTypeId }),
    });

    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Reaction failed");
      return;
    }

    setMessage("Reaction saved.");
    window.location.reload();
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {reactionTypes.map((type) => (
          <Button key={type.id} size="sm" variant="outline" type="button" onClick={() => react(type.id)}>
            {type.name}
          </Button>
        ))}
      </div>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}
