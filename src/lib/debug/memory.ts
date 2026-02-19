/**
 * Dev-only memory diagnostics for local OOM investigations.
 * Logs process memory and query payload shape metrics without raw payload values.
 */
type ActiveHandlesProc = NodeJS.Process & {
  _getActiveHandles?: () => unknown[];
};

declare global {
  // eslint-disable-next-line no-var
  var __mem_debug_interval_started__: boolean | undefined;
}

function mb(bytes: number) {
  return (bytes / 1024 / 1024).toFixed(1);
}

function isEnabled() {
  return process.env.MEM_DEBUG === "1" && process.env.NODE_ENV !== "production";
}

export function startMemoryDebugLogger() {
  if (!isEnabled()) return;
  if (global.__mem_debug_interval_started__) return;
  global.__mem_debug_interval_started__ = true;

  const interval = setInterval(() => {
    const m = process.memoryUsage();
    const proc = process as ActiveHandlesProc;
    const handles = proc._getActiveHandles?.() ?? [];
    const timerHandles = handles.filter((h) => {
      const name = (h as { constructor?: { name?: string } }).constructor?.name;
      return name?.includes("Timeout") || name?.includes("Immediate");
    }).length;

    console.info(
      `[mem] rss=${mb(m.rss)}MB heapUsed=${mb(m.heapUsed)}MB heapTotal=${mb(m.heapTotal)}MB external=${mb(m.external)}MB handles=${handles.length} timers=${timerHandles}`,
    );
  }, 10_000);

  interval.unref();
}

export function logQueryPayload(label: string, data: unknown, rowCountHint?: number) {
  if (!isEnabled()) return;

  const rows = typeof rowCountHint === "number" ? rowCountHint : Array.isArray(data) ? data.length : 1;
  const sample =
    Array.isArray(data) && data.length > 0 && data[0] && typeof data[0] === "object"
      ? (data[0] as Record<string, unknown>)
      : !Array.isArray(data) && data && typeof data === "object"
        ? (data as Record<string, unknown>)
        : null;
  const topLevelKeys = sample ? Object.keys(sample).slice(0, 20) : [];
  const shapeSummary = Buffer.byteLength(
    JSON.stringify({
      rows,
      topLevelKeys,
      keyCount: topLevelKeys.length,
      kind: Array.isArray(data) ? "array" : typeof data,
    }),
  );

  console.info(`[mem][query] ${label} rows=${rows} shape=${mb(shapeSummary)}MB keys=${topLevelKeys.join(",")}`);
}
