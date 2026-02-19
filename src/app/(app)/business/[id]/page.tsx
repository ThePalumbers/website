import { Clock3, ImageIcon, MapPin, MessageSquare, SmilePlus, UserCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getBusinessById, getBusinessFeed } from "@/lib/services";
import { Tabs } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FeedbackForm } from "@/components/feedback/feedback-form";
import { FeedbackCard } from "@/components/feedback/FeedbackCard";
import { getSessionUser } from "@/lib/auth";
import { EmptyState } from "@/components/common/EmptyState";
import { SectionHeader } from "@/components/common/SectionHeader";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BusinessPage({ params }: Props) {
  const { id } = await params;
  const business = await getBusinessById(id);
  if (!business) notFound();

  const feedbacks = await getBusinessFeed(id, 0, 20);
  const user = await getSessionUser();
  const reactionTypes = await prisma.reactionType.findMany({ orderBy: { name: "asc" } });

  const tabs = [
    {
      key: "feedback",
      label: `Feedback (${feedbacks.length})`,
      content: (
        <div className="space-y-3">
          {user ? <FeedbackForm businessId={id} /> : <p className="text-sm text-muted-foreground">Login to write feedback.</p>}
          {feedbacks.length ? (
            feedbacks.map((feedback) => <FeedbackCard key={feedback.id} feedback={feedback} />)
          ) : (
            <EmptyState
              icon={MessageSquare}
              title="No feedback yet"
              description="Be the first to share a review or a tip."
            />
          )}
        </div>
      ),
    },
    {
      key: "photos",
      label: `Photos (${business.photos.length})`,
      content: business.photos.length ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {business.photos.map((photo) => (
            <Card key={photo.id} className="p-4">
              <p className="text-sm font-medium">{photo.label.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{photo.description ?? "No description"}</p>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={ImageIcon} title="No photos yet" description="Uploads will appear here." />
      ),
    },
    {
      key: "hours",
      label: `Hours (${business.businessHours.length})`,
      content: (
        <div className="space-y-2">
          {business.businessHours.map((h) => (
            <Card key={h.id} className="p-3 text-sm text-muted-foreground">
              Day {h.weekday}: {new Date(h.openingTime).toLocaleTimeString()} - {new Date(h.closingTime).toLocaleTimeString()}
            </Card>
          ))}
        </div>
      ),
    },
    {
      key: "checkins",
      label: `Check-ins (${business.checkins.length})`,
      content: business.checkins.length ? (
        <div className="space-y-2">
          {business.checkins.map((c) => (
            <Card key={c.id} className="p-3 text-sm text-muted-foreground">
              {new Date(c.timestamp).toLocaleString()}
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={UserCheck} title="No check-ins yet" description="Recent visits will appear here." />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader title={business.name} subtitle="Business details and social activity" />

      <Card className="p-5">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          {[business.street, `${business.city}, ${business.state}`, business.postalCode].filter(Boolean).join(" ")}
        </p>
        <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">Average rating: {business.avgRating?.toFixed(1) ?? "N/A"}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {reactionTypes.map((type) => (
            <Badge key={type.id} className="text-xs">
              <SmilePlus className="mr-1 h-3 w-3" />
              {type.name}
            </Badge>
          ))}
        </div>
      </Card>

      <Tabs tabs={tabs} defaultKey="feedback" />

      <Card className="p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock3 className="h-4 w-4" />
          Use tabs to switch between feedback, photos, hours and check-ins.
        </p>
      </Card>
    </div>
  );
}
