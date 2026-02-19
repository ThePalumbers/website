import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { guardDevtoolsRoute } from "@/lib/devtools";
import { fail, handleApiError, ok } from "@/lib/http";
import { sanitizeSqlByMode, serializeSqlRows, SQL_TIMEOUT_MS, type SqlKind, type SqlMode } from "@/lib/devtools-sql";

export const runtime = "nodejs";

const bodySchema = z.object({
  sql: z.string().min(1).max(10_000),
  mode: z.enum(["read", "write"]).default("read"),
  commit: z.boolean().optional(),
});

class PreviewRollback extends Error {
  payload: { rowCount: number; rows?: Array<Record<string, unknown>>; message: string };

  constructor(payload: { rowCount: number; rows?: Array<Record<string, unknown>>; message: string }) {
    super("PREVIEW_ROLLBACK");
    this.payload = payload;
  }
}

type SqlClient = {
  $executeRawUnsafe: (query: string) => Promise<number>;
  $queryRawUnsafe: <T = unknown>(query: string) => Promise<T>;
};

function isSanitizerError(error: unknown) {
  return error instanceof Error && /Only one SQL statement|Read mode only allows|Write mode allows|Forbidden SQL|Semicolon|SQL is empty/.test(error.message);
}

async function runStatement(
  tx: SqlClient,
  kind: SqlKind,
  sql: string,
): Promise<{ rowCount: number; rows?: Array<Record<string, unknown>> }> {
  if (kind === "select" || kind === "explain") {
    const rows = await tx.$queryRawUnsafe<Record<string, unknown>[]>(sql);
    const safeRows = serializeSqlRows(rows ?? []);
    return { rowCount: safeRows.length, rows: safeRows };
  }

  const rowCount = await tx.$executeRawUnsafe(sql);
  return { rowCount };
}

export async function POST(request: Request) {
  const guard = await guardDevtoolsRoute();
  if (guard) return guard;

  if (process.env.DEVTOOLS_SQL_ENABLED !== "1") {
    return fail("SQL Console is disabled. Set DEVTOOLS_SQL_ENABLED=1 in .env", 403);
  }

  try {
    const payload = bodySchema.parse(await request.json());
    const mode: SqlMode = payload.mode;
    const commitRequested = payload.commit === true;

    if (mode === "write" && process.env.DEVTOOLS_SQL_WRITE_ENABLED !== "1") {
      return fail("SQL write mode is disabled. Set DEVTOOLS_SQL_WRITE_ENABLED=1 in .env", 403);
    }

    const sanitized = sanitizeSqlByMode(payload.sql, mode);
    const sqlPreview = payload.sql.replace(/\s+/g, " ").trim().slice(0, 120);
    const user = await getSessionUser();
    console.info(
      `[devtools-sql] user=${user?.name ?? "anonymous"} mode=${mode} commit=${commitRequested} at=${new Date().toISOString()} sql=${sqlPreview}`,
    );

    const started = performance.now();

    if (mode === "read") {
      const rows = await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL statement_timeout = '${SQL_TIMEOUT_MS}ms'`);
        return tx.$queryRawUnsafe<Record<string, unknown>[]>(sanitized.sql);
      });

      const safeRows = serializeSqlRows(rows ?? []);
      const ms = Math.round(performance.now() - started);

      return ok({
        ok: true,
        ms,
        mode,
        committed: false,
        rowCount: safeRows.length,
        rows: safeRows,
      });
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL statement_timeout = '${SQL_TIMEOUT_MS}ms'`);
        const executed = await runStatement(tx, sanitized.kind, sanitized.sql);

        if (!commitRequested) {
          throw new PreviewRollback({
            rowCount: executed.rowCount,
            rows: executed.rows,
            message: "rolled back (preview)",
          });
        }

        return executed;
      });

      const ms = Math.round(performance.now() - started);
      return ok({
        ok: true,
        ms,
        mode,
        committed: true,
        rowCount: result.rowCount,
        rows: result.rows,
      });
    } catch (error) {
      if (error instanceof PreviewRollback) {
        const ms = Math.round(performance.now() - started);
        return ok({
          ok: true,
          ms,
          mode,
          committed: false,
          rowCount: error.payload.rowCount,
          rows: error.payload.rows,
          message: error.payload.message,
        });
      }
      throw error;
    }
  } catch (error) {
    if (isSanitizerError(error)) {
      return fail((error as Error).message, 400);
    }
    return handleApiError(error);
  }
}
