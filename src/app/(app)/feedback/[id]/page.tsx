import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ReactionPicker } from "@/components/feedback/reaction-picker";
import { getSessionUser } from "@/lib/auth";
import { SectionHeader } from "@/components/common/SectionHeader";

type Props = { params: Promise<{ id: string }> };

export default async function FeedbackPage({ params }: Props) {
  const { id } = await params;

  const feedback = await prisma.feedback.findUnique({
    where: { id },
    include: {
      user: true,
      business: true,
      reactions: {
        include: {
          user: true,
          reactionType: true,
        },
      },
    },
  });

  if (!feedback) notFound();

  const reactionTypes = await prisma.reactionType.findMany({ orderBy: { name: "asc" } });
  const user = await getSessionUser();

  return (
    <div className="space-y-4">
      <SectionHeader title="Feedback detail" subtitle={`By ${feedback.user.name} on ${feedback.business.name}`} />

      <Card className="p-4">
        <p className="text-sm leading-6">{feedback.text}</p>
        {feedback.rating ? <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">Rating: {feedback.rating}/5</p> : null}
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <MessageCircle className="h-4 w-4" />
          Reactions
        </div>
        <Separator className="my-3" />
        <div className="space-y-2 text-sm text-muted-foreground">
          {feedback.reactions.length ? (
            feedback.reactions.map((reaction) => (
              <p key={reaction.id}>
                {reaction.user.name} reacted with {reaction.reactionType?.name ?? "n/a"}
              </p>
            ))
          ) : (
            <p>No reactions yet.</p>
          )}
        </div>
      </Card>

      {user ? (
        <Card className="p-4">
          <h2 className="mb-2 text-sm font-medium">React to this feedback</h2>
          <ReactionPicker feedbackId={feedback.id} reactionTypes={reactionTypes} />
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">Login to react.</p>
      )}
    </div>
  );
}
