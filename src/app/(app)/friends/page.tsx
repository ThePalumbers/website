import Link from "next/link";
import { Users } from "lucide-react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { listAcceptedFriends, listPendingFriendships } from "@/lib/services";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RespondButtons } from "@/components/friends/respond-buttons";
import { SendRequestForm } from "@/components/friends/send-request-form";
import { EmptyState } from "@/components/common/EmptyState";
import { SectionHeader } from "@/components/common/SectionHeader";

export default async function FriendsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const [friends, pending] = await Promise.all([listAcceptedFriends(user.id), listPendingFriendships(user.id)]);

  return (
    <div className="space-y-5">
      <SectionHeader title="Friends" subtitle="Manage requests and accepted friendships" />

      <SendRequestForm />

      <Card className="p-4">
        <h2 className="text-sm font-medium">Incoming requests</h2>
        <Separator className="my-3" />
        <div className="space-y-3">
          {pending.incoming.length ? (
            pending.incoming.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <p>{item.requester.name}</p>
                <RespondButtons requestId={item.id} />
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No incoming requests.</p>
          )}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-sm font-medium">Outgoing requests</h2>
        <Separator className="my-3" />
        <div className="space-y-2">
          {pending.outgoing.length ? (
            pending.outgoing.map((item) => (
              <p key={item.id} className="rounded-md border p-3 text-sm text-muted-foreground">
                Pending with {item.addressee.name}
              </p>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No outgoing requests.</p>
          )}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-sm font-medium">Accepted friends ({friends.length})</h2>
        <Separator className="my-3" />
        {friends.length ? (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {friends.map((friend) => (
              <Link key={friend.id} href={`/u/${encodeURIComponent(friend.name)}`} className="rounded-md border p-3 text-sm hover:bg-accent/40">
                {friend.name}
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState icon={Users} title="No friends yet" description="Send requests to build your network." />
        )}
      </Card>
    </div>
  );
}
