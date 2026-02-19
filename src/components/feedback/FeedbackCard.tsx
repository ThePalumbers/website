import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ReactionPicker } from "@/components/feedback/reaction-picker";
import { type QuickReactionType } from "@/lib/quick-reactions";
import { FeedbackActions } from "@/components/feedback/FeedbackActions";
import { StarRatingDisplay } from "@/components/feedback/StarRatingDisplay";

type FeedbackModel = {
  id: string;
  type: "review" | "tip";
  userId: string;
  businessId: string;
  rating: number | null;
  text: string | null;
  timestamp: Date;
  user?: { name: string } | null;
  reactions: Array<{ userId: string; reactionType: { name: string } | null }>;
};

export function FeedbackCard({
  feedback,
  quickReactionTypes,
  currentUserId = null,
  authorUserId = null,
}: {
  feedback: FeedbackModel;
  quickReactionTypes: QuickReactionType[];
  currentUserId?: string | null;
  authorUserId?: string | null;
}) {
  return (
    <Card className="p-4 transition-colors hover:border-foreground/10 hover:bg-accent/40">
      <div className="flex items-center justify-between gap-4 text-sm">
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">{feedback.user?.name ?? "Anonymous"}</span> · {feedback.type}
        </p>
        <div className="flex items-center gap-1">
          <p className="text-xs text-muted-foreground">{new Date(feedback.timestamp).toLocaleString()}</p>
          <FeedbackActions
            feedback={{
              id: feedback.id,
              userId: feedback.userId,
              businessId: feedback.businessId,
              type: feedback.type,
              text: feedback.text,
              rating: feedback.rating,
            }}
            currentUserId={currentUserId}
          />
        </div>
      </div>

      <p className="mt-2 text-sm leading-6">{feedback.text}</p>
      {feedback.rating ? <StarRatingDisplay rating={feedback.rating} className="mt-2" /> : null}

      <Separator className="my-3" />

      <div className="flex items-center justify-between gap-2">
        <ReactionPicker
          feedbackId={feedback.id}
          reactionTypes={quickReactionTypes}
          reactions={feedback.reactions}
          currentUserId={currentUserId}
          authorUserId={authorUserId}
        />
        <Link href={`/feedback/${feedback.id}`} className="inline-flex items-center gap-1 text-xs text-brand/60 hover:text-brand hover:underline">
          <MessageSquare className="h-3.5 w-3.5" />
          Details
        </Link>
      </div>
    </Card>
  );
}
