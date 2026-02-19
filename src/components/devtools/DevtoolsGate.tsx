"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Lock, Wrench } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiRunner } from "@/components/devtools/ApiRunner";
import { DbInspector } from "@/components/devtools/DbInspector";
import { SqlConsole } from "@/components/devtools/SqlConsole";
import { Tabs } from "@/components/ui/tabs";

type Props = {
  initialUnlocked: boolean;
};

export function DevtoolsGate({ initialUnlocked }: Props) {
  const [token, setToken] = useState("");
  const [unlocked, setUnlocked] = useState(initialUnlocked);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onUnlock = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/devtools/unlock", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? `Unlock failed (${response.status}).`);
        return;
      }

      setUnlocked(true);
      setToken("");
    } catch {
      setError("Network error while unlocking devtools.");
    } finally {
      setLoading(false);
    }
  };

  if (!unlocked) {
    return (
      <div className="page-shell py-10">
        <Card className="mx-auto max-w-md p-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium">
            <Lock className="h-4 w-4" />
            Devtools unlock required
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Enter <code>DEVTOOLS_TOKEN</code> to access internal devtools.
          </p>
          <form className="space-y-3" onSubmit={onUnlock}>
            <Input
              type="password"
              placeholder="DEVTOOLS_TOKEN"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              autoComplete="off"
            />
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
            <Button type="submit" disabled={loading || !token.trim()}>
              {loading ? "Unlocking..." : "Unlock"}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-shell py-8">
      <div className="mb-4 flex items-center gap-2 text-sm font-medium">
        <Wrench className="h-4 w-4" />
        Devtools
      </div>
      <Tabs
        defaultKey="api-runner"
        tabs={[
          { key: "api-runner", label: "API Runner", content: <ApiRunner /> },
          { key: "db-inspector", label: "DB Inspector", content: <DbInspector /> },
          { key: "sql-console", label: "SQL Console", content: <SqlConsole /> },
        ]}
      />
    </div>
  );
}
