import { notFound } from "next/navigation";
import { UserCircle2 } from "lucide-react";
import { getUserProfile } from "@/lib/services";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";
import { SectionHeader } from "@/components/common/SectionHeader";
import { FeedbackCard } from "@/components/feedback/FeedbackCard";

type Props = { params: Promise<{ username: string }> };

export default async function UserPage({ params }: Props) {
  const { username } = await params;
  const profile = await getUserProfile(username);

  if (!profile) notFound();

  return (
    <div className="space-y-5">
      <SectionHeader title={profile.name} subtitle={`Member since ${new Date(profile.registrationDate).toLocaleDateString()}`} />

      <Card className="p-4 text-sm text-muted-foreground">Recent activity and feedback history.</Card>

      <div className="space-y-3">
        {profile.feedbacks.length ? (
          profile.feedbacks.map((feedback) => (
            <FeedbackCard
              key={feedback.id}
              feedback={{
                ...feedback,
                user: { name: profile.name },
                reactions: [],
              }}
            />
          ))
        ) : (
          <EmptyState icon={UserCircle2} title="No feedback yet" description="This user has not posted feedback yet." />
        )}
      </div>
    </div>
  );
}
