"use client";

import { type ComponentType, useCallback, useState } from "react";
import Link from "next/link";
import { Laugh, Sparkles, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { normalizeReactionName, type QuickReactionKey, type QuickReactionType } from "@/lib/quick-reactions";
import { useRealtimeReactions } from "@/hooks/useRealtimeReactions";
import type { ReactionsEventPayload } from "@/lib/reactions-realtime";

type ReactionEntry = {
  userId: string;
  reactionType: { name: string } | null;
};

type Props = {
  feedbackId: string;
  reactionTypes: QuickReactionType[];
  reactions: ReactionEntry[];
  currentUserId: string | null;
  authorUserId: string | null;
};

const ICONS: Record<QuickReactionKey, ComponentType<{ className?: string }>> = {
  useful: ThumbsUp,
  funny: Laugh,
  cool: Sparkles,
};

export function ReactionPicker({ feedbackId, reactionTypes, reactions, currentUserId, authorUserId }: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const isOwnFeedback = Boolean(currentUserId && authorUserId && currentUserId === authorUserId);
  const [selectedKey, setSelectedKey] = useState<QuickReactionKey | null>(() => {
    if (!currentUserId) return null;
    const mine = reactions.find((r) => r.userId === currentUserId);
    return normalizeReactionName(mine?.reactionType?.name);
  });
  const [counts, setCounts] = useState<Record<QuickReactionKey, number>>(() => {
    const base: Record<QuickReactionKey, number> = { useful: 0, funny: 0, cool: 0 };
    for (const reaction of reactions) {
      const key = normalizeReactionName(reaction.reactionType?.name);
      if (!key) continue;
      base[key] += 1;
    }
    return base;
  });

  const handleRealtimeReaction = useCallback((event: ReactionsEventPayload) => {
    if (!event.counts) return;
    setCounts({
      useful: Number(event.counts.useful ?? 0),
      funny: Number(event.counts.funny ?? 0),
      cool: Number(event.counts.cool ?? 0),
    });
  }, []);

  useRealtimeReactions({ feedbackId }, handleRealtimeReaction);

  async function react(target: QuickReactionType) {
    if (isOwnFeedback) {
      setMessage("You can't react to your own feedback.");
      return;
    }
    if (!currentUserId) {
      setMessage("Login to react");
      return;
    }
    setMessage(null);
    setPending(target.id);

    const prevSelected = selectedKey;
    const prevCounts = { ...counts };
    const isToggleOff = prevSelected === target.key;

    setSelectedKey(isToggleOff ? null : target.key);
    setCounts((prev) => {
      const next = { ...prev };
      if (isToggleOff) {
        next[target.key] = Math.max(0, next[target.key] - 1);
        return next;
      }

      if (prevSelected && prevSelected !== target.key) {
        next[prevSelected] = Math.max(0, next[prevSelected] - 1);
      }
      next[target.key] += 1;
      return next;
    });

    const res = await fetch("/api/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedbackId, reactionTypeId: target.id }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      status?: "deleted" | "upserted";
      myReactionTypeId?: string | null;
    };
    if (!res.ok) {
      setSelectedKey(prevSelected);
      setCounts(prevCounts);
      setMessage(data.error ?? "Reaction failed");
      setPending(null);
      return;
    }

    if (data.status === "deleted") {
      setSelectedKey(null);
    } else if (data.status === "upserted") {
      setSelectedKey(target.key);
    }

    setPending(null);
  }

  return (
    <div className="space-y-2">
      {reactionTypes.length ? (
        <div className="flex flex-wrap gap-2">
          {reactionTypes.map((type) => {
            const selected = selectedKey === type.key;
            const Icon = ICONS[type.key];
            return (
              <Button
                key={type.id}
                size="sm"
                variant="outline"
                type="button"
                disabled={pending === type.id || isOwnFeedback}
                onClick={() => react(type)}
                className={cn(
                  "h-8 gap-1.5 border-border/70 bg-background text-muted-foreground transition-colors hover:border-[#DE0F3F]/30 hover:bg-[#DE0F3F]/5 hover:text-foreground",
                  selected && "border-[#DE0F3F]/60 text-[#DE0F3F]",
                  isOwnFeedback && "cursor-not-allowed opacity-70",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="capitalize">{type.key}</span>
                <span className={cn("text-xs", selected ? "text-[#DE0F3F]" : "text-muted-foreground")}>
                  {counts[type.key]}
                </span>
              </Button>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Quick reaction types are not configured.</p>
      )}
      {isOwnFeedback ? <p className="text-xs text-muted-foreground">You can't react to your own feedback.</p> : null}
      {message === "Login to react" ? (
        <p className="text-xs text-muted-foreground">
          Login to react.{" "}
          <Link href="/auth/login" className="text-brand hover:text-secondary-brand hover:underline">
            Go to login
          </Link>
        </p>
      ) : null}
      {message && message !== "Login to react" ? <p className="text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}
