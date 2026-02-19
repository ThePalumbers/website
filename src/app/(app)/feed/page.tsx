import { Rss } from "lucide-react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getFriendFeed } from "@/lib/services";
import { parsePageLimit } from "@/lib/utils";
import { EmptyState } from "@/components/common/EmptyState";
import { Pagination } from "@/components/common/Pagination";
import { SectionHeader } from "@/components/common/SectionHeader";
import { FeedbackCard } from "@/components/feedback/FeedbackCard";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function FeedPage({ searchParams }: Props) {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const params = await searchParams;
  const pageRaw = typeof params.page === "string" ? params.page : "1";
  const limitRaw = typeof params.limit === "string" ? params.limit : "20";
  const { page, limit, skip } = parsePageLimit(pageRaw, limitRaw, 20);
  const items = await getFriendFeed(user.id, skip, limit);

  return (
    <div className="space-y-5">
      <SectionHeader title="Feed" subtitle="Latest feedback from accepted friends" />

      <div className="space-y-3">
        {items.length ? (
          items.map((item) => (
            <FeedbackCard
              key={item.id}
              feedback={{
                ...item,
                reactions: item.reactions,
                user: item.user,
              }}
            />
          ))
        ) : (
          <EmptyState
            icon={Rss}
            title="No activity yet"
            description="Once your accepted friends leave feedback, it appears here."
            ctaLabel="Find friends"
            ctaHref="/friends"
          />
        )}
      </div>

      <Pagination basePath="/feed" page={page} totalPages={Math.max(1, page + (items.length === limit ? 1 : 0))} limit={limit} />
    </div>
  );
}
