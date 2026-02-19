import { notFound } from "next/navigation";
import { UserCircle2 } from "lucide-react";
import { getUserProfile } from "@/lib/services";
import { getSessionUser } from "@/lib/auth";
import { getQuickReactionTypes } from "@/lib/quick-reactions";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";
import { FeedbackCard } from "@/components/feedback/FeedbackCard";
import { ShareUserId } from "@/components/user/ShareUserId";

type Props = { params: Promise<{ username: string }> };

export default async function UserPage({ params }: Props) {
  const { username } = await params;
  const [profile, sessionUser, quickReactionTypes] = await Promise.all([
    getUserProfile(username),
    getSessionUser(),
    getQuickReactionTypes(),
  ]);

  if (!profile) notFound();

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{profile.name}</h1>
          <p className="text-sm text-muted-foreground">Member since {new Date(profile.registrationDate).toLocaleDateString()}</p>
        </div>
        {sessionUser?.id === profile.id ? (
          <div className="self-start sm:self-auto">
            <ShareUserId userId={profile.id} />
          </div>
        ) : null}
      </div>
      <Card className="p-4 text-sm text-muted-foreground">Recent activity and feedback history.</Card>

      <div className="space-y-3">
        {profile.feedbacks.length ? (
          profile.feedbacks.map((feedback) => (
              <FeedbackCard
                key={feedback.id}
                feedback={{
                  ...feedback,
                  user: { name: profile.name },
                  reactions: feedback.reactions,
                }}
                quickReactionTypes={quickReactionTypes}
                currentUserId={sessionUser?.id ?? null}
                authorUserId={profile.id}
              />
          ))
        ) : (
          <EmptyState icon={UserCircle2} title="No feedback yet" description="This user has not posted feedback yet." />
        )}
      </div>
    </div>
  );
}
