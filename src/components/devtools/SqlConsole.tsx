"use client";

import { useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type SqlMode = "read" | "write";

type SqlResponse = {
  ok: boolean;
  ms: number;
  mode: SqlMode;
  committed: boolean;
  rowCount: number;
  rows?: Array<Record<string, unknown>>;
  message?: string;
};

type HistoryItem = {
  id: string;
  sql: string;
  mode: SqlMode;
  createdAt: number;
};

const HISTORY_KEY = "devtools.sql.history";

const presets = [
  { label: "Count users", sql: 'SELECT count(*) FROM "USERS";' },
  { label: "Businesses (20)", sql: 'SELECT * FROM "BUSINESSES" LIMIT 20;' },
  {
    label: "Latest feedback join",
    sql: `SELECT f."Id", f."Type", f."Rating", f."Timestamp", u."Name" AS "UserName", b."Name" AS "BusinessName"
FROM "FEEDBACKS" f
JOIN "USERS" u ON u."Id" = f."UserId"
JOIN "BUSINESSES" b ON b."Id" = f."BusinessId"
ORDER BY f."Timestamp" DESC
LIMIT 20;`,
  },
];

function readHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? (JSON.parse(raw) as HistoryItem[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeHistory(items: HistoryItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
}

export function SqlConsole() {
  const [sql, setSql] = useState('SELECT count(*) FROM "USERS";');
  const [mode, setMode] = useState<SqlMode>("read");
  const [writeModeEnabled, setWriteModeEnabled] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<SqlResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(() => readHistory());

  const rows = response?.rows ?? [];
  const columns = useMemo(() => {
    if (!rows.length) return [];
    return Object.keys(rows[0] ?? {}).slice(0, 10);
  }, [rows]);

  const writeArmed = writeModeEnabled && acknowledged && confirmText === "WRITE";

  const runSql = async (commit: boolean) => {
    setRunning(true);
    setError(null);
    setResponse(null);

    try {
      const currentMode: SqlMode = mode;
      const body = { sql, mode: currentMode, commit: currentMode === "write" ? commit : false };

      const res = await fetch("/api/devtools/sql", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const raw = await res.text();
      const data = raw ? JSON.parse(raw) : null;

      if (!res.ok) {
        setError(data?.error ?? `SQL execution failed (${res.status}).`);
        return;
      }

      const nextHistory: HistoryItem[] = [
        { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, sql, mode: currentMode, createdAt: Date.now() },
        ...history,
      ].slice(0, 20);
      setHistory(nextHistory);
      writeHistory(nextHistory);
      setResponse(data as SqlResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "SQL request failed.");
    } finally {
      setRunning(false);
    }
  };

  const statusLabel = !response
    ? mode === "write"
      ? "WRITE-PREVIEW"
      : "READ"
    : response.mode === "read"
      ? "READ"
      : response.committed
        ? "WRITE-COMMITTED"
        : "WRITE-PREVIEW";

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={statusLabel === "WRITE-COMMITTED" ? "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400" : statusLabel === "WRITE-PREVIEW" ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"}>
            {statusLabel}
          </Badge>

          <Button variant={mode === "read" ? "default" : "outline"} size="sm" onClick={() => setMode("read")}>
            Read
          </Button>
          <Button variant={mode === "write" ? "default" : "outline"} size="sm" onClick={() => setMode("write")}>
            Write
          </Button>

          <label className="ml-2 inline-flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={writeModeEnabled}
              onChange={(e) => {
                setWriteModeEnabled(e.target.checked);
                if (!e.target.checked) {
                  setAcknowledged(false);
                  setConfirmText("");
                }
              }}
            />
            Enable write mode
          </label>
        </div>

        {mode === "write" ? (
          <div className="space-y-2 rounded-md border p-3">
            <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} />
              I understand this can modify the DB
            </label>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type WRITE to confirm"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            defaultValue=""
            onChange={(e) => {
              const selected = presets.find((p) => p.label === e.target.value);
              if (selected) setSql(selected.sql);
            }}
          >
            <option value="" disabled>
              Presets
            </option>
            {presets.map((preset) => (
              <option key={preset.label} value={preset.label}>
                {preset.label}
              </option>
            ))}
          </select>

          {mode === "write" ? (
            <>
              <Button onClick={() => runSql(false)} disabled={running || !sql.trim() || !writeArmed}>
                {running ? "Running..." : "Run (Preview)"}
              </Button>
              <Button
                className="bg-red-600 text-white hover:bg-red-600/90"
                onClick={() => runSql(true)}
                disabled={running || !sql.trim() || !writeArmed}
              >
                {running ? "Running..." : "Commit"}
              </Button>
            </>
          ) : (
            <Button onClick={() => runSql(false)} disabled={running || !sql.trim()}>
              {running ? "Running..." : "Run"}
            </Button>
          )}
        </div>

        <textarea
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          rows={12}
          className="h-[260px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
          spellCheck={false}
        />

        {error ? (
          <p className="inline-flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>
        ) : null}

        {response ? (
          <Card className="space-y-3 border p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={response.mode === "read" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : response.committed ? "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400" : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"}>
                {response.mode === "read" ? "READ" : response.committed ? "WRITE-COMMITTED" : "WRITE-PREVIEW"}
              </Badge>
              <p className="text-sm text-muted-foreground">
                {response.ms} ms · {response.rowCount} rows
              </p>
              {response.message ? <p className="text-sm text-muted-foreground">{response.message}</p> : null}
            </div>

            {columns.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((col) => (
                      <TableHead key={col}>{col}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, idx) => (
                    <TableRow key={idx}>
                      {columns.map((col) => (
                        <TableCell key={col} className="max-w-[240px] truncate text-xs">
                          {String((row as Record<string, unknown>)[col] ?? "")}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">No rows returned.</p>
            )}

            <details className="rounded-md border border-border p-2">
              <summary className="cursor-pointer text-xs font-medium text-muted-foreground">Raw JSON</summary>
              <pre className="mt-2 max-h-[320px] overflow-auto text-xs">{JSON.stringify(rows, null, 2)}</pre>
            </details>
          </Card>
        ) : null}
      </Card>

      <Card className="p-4">
        <p className="mb-3 text-xs font-medium text-muted-foreground">History (last 20)</p>
        {history.length ? (
          <div className="space-y-2">
            {history.map((item) => (
              <div key={item.id} className="rounded-md border border-border p-2">
                <p className="truncate text-xs text-muted-foreground">[{item.mode}] {item.sql}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="text-[11px] text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSql(item.sql);
                      setMode(item.mode);
                    }}
                  >
                    Load
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No history yet.</p>
        )}
      </Card>
    </div>
  );
}
