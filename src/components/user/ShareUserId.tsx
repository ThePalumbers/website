"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fallback below
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export function ShareUserId({ userId }: { userId: string }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, []);

  async function onCopy() {
    if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    setCopyError(null);
    const ok = await copyToClipboard(userId);

    if (ok) {
      setCopied(true);
      copiedTimeoutRef.current = setTimeout(() => setCopied(false), 1500);
      return;
    }

    setCopied(false);
    setCopyError("Copy not available in this browser");
    errorTimeoutRef.current = setTimeout(() => setCopyError(null), 2000);
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border bg-card p-3">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">Share ID</p>
        <p className="font-mono text-xs text-foreground/80 truncate">{userId}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="sr-only" aria-live="polite">
          {copied ? "Copied" : copyError ? copyError : ""}
        </span>
        {copyError ? <span className="text-xs text-muted-foreground">{copyError}</span> : null}
        <Button
          size="sm"
          variant="outline"
          type="button"
          aria-label="Copy Share ID"
          onClick={onCopy}
          className={copied ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15" : undefined}
        >
          {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}
