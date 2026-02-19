import Link from "next/link";
import { Card } from "@/components/ui/card";

type FeedbackItemModel = {
  id: string;
  type: string;
  rating: number | null;
  text: string | null;
  timestamp: Date;
  user: { name: string } | null;
  reactions: Array<{ reactionType: { name: string } | null }>;
};

export function FeedbackItem({ feedback }: { feedback: FeedbackItemModel }) {
  const grouped = feedback.reactions.reduce((acc: Record<string, number>, r) => {
    const key = r.reactionType?.name ?? "other";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <Card>
      <div className="flex items-center justify-between gap-3 text-sm">
        <p>
          <strong>{feedback.user?.name}</strong> · {feedback.type}
        </p>
        <p>{new Date(feedback.timestamp).toLocaleString()}</p>
      </div>
      {feedback.rating ? <p className="mt-1 text-sm">Rating: {feedback.rating}/5</p> : null}
      <p className="mt-2 whitespace-pre-wrap">{feedback.text}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#675f55]">
        {Object.entries(grouped).map(([name, count]) => (
          <span key={name} className="rounded-full bg-[#ece2d0] px-2 py-1">
            {name}: {String(count)}
          </span>
        ))}
      </div>
      <Link href={`/feedback/${feedback.id}`} className="mt-3 inline-block text-sm text-[var(--accent-2)] underline">
        Open detail
      </Link>
    </Card>
  );
}
