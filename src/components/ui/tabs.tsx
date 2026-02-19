"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Tab = { key: string; label: string; content: React.ReactNode };

export function Tabs({ tabs, defaultKey }: { tabs: Tab[]; defaultKey?: string }) {
  const [active, setActive] = useState(defaultKey ?? tabs[0]?.key);

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2 border-b pb-3">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm transition-colors",
              active === tab.key
                ? "border-foreground/15 bg-accent text-accent-foreground"
                : "border-transparent text-muted-foreground hover:border-border hover:bg-accent/40",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{tabs.find((tab) => tab.key === active)?.content}</div>
    </div>
  );
}
