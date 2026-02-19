import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type FeedbackModel = {
  id: string;
  type: string;
  rating: number | null;
  text: string | null;
  timestamp: Date;
  user?: { name: string } | null;
  reactions: Array<{ reactionType: { name: string } | null }>;
};

export function FeedbackCard({ feedback }: { feedback: FeedbackModel }) {
  const grouped = feedback.reactions.reduce((acc: Record<string, number>, item) => {
    const key = item.reactionType?.name ?? "other";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <Card className="p-4 transition-colors hover:border-foreground/10 hover:bg-accent/40">
      <div className="flex items-center justify-between gap-4 text-sm">
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">{feedback.user?.name ?? "Anonymous"}</span> · {feedback.type}
        </p>
        <p className="text-xs text-muted-foreground">{new Date(feedback.timestamp).toLocaleString()}</p>
      </div>

      <p className="mt-2 text-sm leading-6">{feedback.text}</p>
      {feedback.rating ? <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">Rating {feedback.rating}/5</p> : null}

      <Separator className="my-3" />

      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(grouped).map(([name, count]) => (
            <Badge key={name} className="border-secondary-brand/25 bg-secondary-brand/10 text-brand/60">
              {name} {count}
            </Badge>
          ))}
        </div>
        <Link href={`/feedback/${feedback.id}`} className="inline-flex items-center gap-1 text-xs text-brand/60 hover:text-brand hover:underline">
          <MessageSquare className="h-3.5 w-3.5" />
          Details
        </Link>
      </div>
    </Card>
  );
}
