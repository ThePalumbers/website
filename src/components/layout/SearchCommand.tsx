"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

  const submit = (raw: string) => {
    const value = raw.trim();
    if (!value) return;
    router.push(`/explore?query=${encodeURIComponent(value)}`);
    setOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-8 select-none px-0 text-muted-foreground transition-colors hover:text-brand/60"
        onClick={() => setOpen(true)}
        aria-label="Open search"
      >
        <Search className="h-4 w-4" />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          autoFocus
          placeholder="Search businesses..."
          value={query}
          onValueChange={setQuery}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit(query);
            }
          }}
        />
        <CommandList>
          <CommandEmpty>No search query yet.</CommandEmpty>
          <CommandGroup heading="Actions">
            <CommandItem onSelect={() => submit(query)}>
              Search for &quot;{query || "businesses"}&quot;
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
