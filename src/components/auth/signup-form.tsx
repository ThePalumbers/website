"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Signup failed.");
      return;
    }

    router.push("/feed");
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" required />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Email</label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Password</label>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 8 chars" required />
      </div>
      <Button type="submit" className="w-full">Create account</Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </form>
  );
}
