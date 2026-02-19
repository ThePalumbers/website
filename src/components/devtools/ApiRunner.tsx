"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type SavedRequest = {
  id: string;
  name: string;
  method: HttpMethod;
  path: string;
  headers: string;
  body: string;
};

type RunnerResponse = {
  status: number;
  elapsedMs: number;
  headers: Record<string, string>;
  bodyText: string;
  bodyJson: unknown | null;
};

const STORAGE_KEY = "devtools.savedRequests";

const presets: Array<Omit<SavedRequest, "id">> = [
  { name: "Health", method: "GET", path: "/api/health", headers: "{}", body: "" },
  { name: "Businesses", method: "GET", path: "/api/businesses?page=1&limit=10", headers: "{}", body: "" },
  {
    name: "Login",
    method: "POST",
    path: "/api/auth/login",
    headers: '{"Content-Type":"application/json"}',
    body: '{"email":"smoke_user@palumbers.dev","password":"password123"}',
  },
  { name: "Me", method: "GET", path: "/api/auth/me", headers: "{}", body: "" },
  {
    name: "Feedback (review)",
    method: "POST",
    path: "/api/feedback",
    headers: '{"Content-Type":"application/json"}',
    body: '{"type":"review","businessId":"<BUSINESS_ID>","text":"Great service","rating":5}',
  },
  {
    name: "Reactions",
    method: "POST",
    path: "/api/reactions",
    headers: '{"Content-Type":"application/json"}',
    body: '{"feedbackId":"<FEEDBACK_ID>","reactionTypeId":"<REACTION_TYPE_ID>"}',
  },
  {
    name: "Friend request",
    method: "POST",
    path: "/api/friendships/request",
    headers: '{"Content-Type":"application/json"}',
    body: '{"toUserId":"<USER_ID>"}',
  },
  {
    name: "Friend respond",
    method: "POST",
    path: "/api/friendships/respond",
    headers: '{"Content-Type":"application/json"}',
    body: '{"requestId":"<REQUEST_ID>","action":"accept"}',
  },
  { name: "Feed", method: "GET", path: "/api/feed?page=1&limit=10", headers: "{}", body: "" },
];

function tryParseJson(input: string) {
  if (!input.trim()) return null;
  return JSON.parse(input);
}

function readSavedRequests(): SavedRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedRequest[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSavedRequests(items: SavedRequest[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function ApiRunner() {
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [path, setPath] = useState("/api/businesses?page=1&limit=10");
  const [headersText, setHeadersText] = useState("{}");
  const [bodyText, setBodyText] = useState("{}");
  const [response, setResponse] = useState<RunnerResponse | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveName, setSaveName] = useState("");
  const [saved, setSaved] = useState<SavedRequest[]>(() => readSavedRequests());

  const methods: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

  const printableBody = useMemo(() => {
    if (!response) return "";
    if (response.bodyJson !== null) return JSON.stringify(response.bodyJson, null, 2);
    return response.bodyText;
  }, [response]);

  const onSend = async () => {
    setError(null);
    setRunning(true);
    setResponse(null);

    try {
      if (!path.startsWith("/api/")) {
        setError("Path must start with /api/.");
        return;
      }

      const parsedHeaders = (tryParseJson(headersText) ?? {}) as Record<string, string>;
      const init: RequestInit = {
        method,
        credentials: "same-origin",
        headers: parsedHeaders,
      };

      if (method !== "GET") {
        const parsedBody = tryParseJson(bodyText);
        if (parsedBody !== null) {
          init.body = JSON.stringify(parsedBody);
          if (!parsedHeaders["Content-Type"] && !parsedHeaders["content-type"]) {
            (init.headers as Record<string, string>)["Content-Type"] = "application/json";
          }
        }
      }

      const startedAt = performance.now();
      const res = await fetch(path, init);
      const elapsedMs = Math.round(performance.now() - startedAt);

      const responseText = await res.text();
      let responseJson: unknown | null = null;
      try {
        responseJson = responseText ? JSON.parse(responseText) : null;
      } catch {
        responseJson = null;
      }

      const responseHeaders: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      setResponse({
        status: res.status,
        elapsedMs,
        headers: responseHeaders,
        bodyText: responseText,
        bodyJson: responseJson,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setRunning(false);
    }
  };

  const loadRequest = (item: SavedRequest) => {
    setMethod(item.method);
    setPath(item.path);
    setHeadersText(item.headers);
    setBodyText(item.body || "{}");
  };

  const onSave = () => {
    const name = saveName.trim();
    if (!name) return;

    const item: SavedRequest = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name,
      method,
      path,
      headers: headersText,
      body: bodyText,
    };

    const next = [item, ...saved].slice(0, 30);
    setSaved(next);
    writeSavedRequests(next);
    setSaveName("");
  };

  const onDelete = (id: string) => {
    const next = saved.filter((item) => item.id !== id);
    setSaved(next);
    writeSavedRequests(next);
  };

  const applyPreset = (preset: Omit<SavedRequest, "id">) => {
    setMethod(preset.method);
    setPath(preset.path);
    setHeadersText(preset.headers);
    setBodyText(preset.body || "{}");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="space-y-4 p-4">
        <div className="grid gap-3 md:grid-cols-[140px_minmax(0,1fr)]">
          <label className="text-xs font-medium text-muted-foreground">Method</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as HttpMethod)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {methods.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <label className="text-xs font-medium text-muted-foreground">Path</label>
          <Input value={path} onChange={(e) => setPath(e.target.value)} placeholder="/api/..." />

          <label className="text-xs font-medium text-muted-foreground">Headers (JSON)</label>
          <textarea
            value={headersText}
            onChange={(e) => setHeadersText(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
          />

          {method !== "GET" ? (
            <>
              <label className="text-xs font-medium text-muted-foreground">Body (JSON)</label>
              <textarea
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                rows={8}
                className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
              />
            </>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={onSend} disabled={running}>
            {running ? "Sending..." : "Send"}
          </Button>
          <Input
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="Saved request name"
            className="max-w-56"
          />
          <Button onClick={onSave} variant="outline" disabled={!saveName.trim()}>
            Save request
          </Button>
        </div>

        {error ? <p className="text-xs text-destructive">{error}</p> : null}

        {response ? (
          <Card className="space-y-3 border p-3">
            <p className="text-sm">
              <span className="font-medium">Status:</span> {response.status} ·{" "}
              <span className="font-medium">Elapsed:</span> {response.elapsedMs} ms
            </p>

            <details className="rounded-md border border-border p-2">
              <summary className="cursor-pointer text-xs font-medium text-muted-foreground">Response headers</summary>
              <pre className="mt-2 overflow-x-auto text-xs">{JSON.stringify(response.headers, null, 2)}</pre>
            </details>

            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Response body</p>
              <pre className="max-h-[420px] overflow-auto rounded-md border border-border bg-muted/30 p-3 text-xs">
                {printableBody || "<empty>"}
              </pre>
            </div>
          </Card>
        ) : null}
      </Card>

      <div className="space-y-4">
        <Card className="p-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Presets</p>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <Button key={preset.name} size="sm" variant="outline" onClick={() => applyPreset(preset)}>
                {preset.name}
              </Button>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Saved requests</p>
          {saved.length ? (
            <div className="space-y-2">
              {saved.map((item) => (
                <div key={item.id} className="rounded-md border border-border p-2">
                  <p className="text-xs font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.method} {item.path}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => loadRequest(item)}>
                      Load
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onDelete(item.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No saved requests yet.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
