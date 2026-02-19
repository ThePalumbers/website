"use client";

import { Button } from "@/components/ui/button";

export function RespondButtons({ requestId }: { requestId: string }) {
  async function act(action: "accept" | "reject") {
    const res = await fetch("/api/friendships/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, action }),
    });

    if (res.ok) {
      window.location.reload();
    }
  }

  return (
    <div className="flex gap-2">
      <Button type="button" size="sm" onClick={() => act("accept")}>
        Accept
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={() => act("reject")}>
        Reject
      </Button>
    </div>
  );
}
