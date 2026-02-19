"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SendRequestForm() {
  const [toUserId, setToUserId] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/friendships/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toUserId }),
    });
    const data = await res.json();
    setMessage(res.ok ? "Request sent." : data.error ?? "Failed");
    if (res.ok) {
      setToUserId("");
      window.location.reload();
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border bg-card p-4 shadow-sm">
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Recipient user id</label>
        <Input value={toUserId} onChange={(e) => setToUserId(e.target.value)} placeholder="22-char user id" required />
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit">Send request</Button>
        {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
      </div>
    </form>
  );
}
