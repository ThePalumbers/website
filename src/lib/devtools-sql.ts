export type SqlMode = "read" | "write";
export type SqlKind = "select" | "explain" | "write";

const MAX_ROWS = 200;

const READ_FORBIDDEN = /\b(insert|update|delete|drop|alter|create|truncate|grant|revoke|copy|call|do|execute|vacuum|analyze)\b/i;
const WRITE_FORBIDDEN = /\b(drop|alter|create|truncate|grant|revoke|copy|call|do|execute|vacuum|analyze)\b/i;

const READ_ALLOWED_START = /^(select|with|explain)\b/i;
const WRITE_ALLOWED_START = /^(select|with|explain|insert|update|delete)\b/i;

function normalizeSql(sql: string) {
  return sql.replace(/\u0000/g, "").trim();
}

function stripTrailingSemicolon(sql: string) {
  return sql.replace(/;\s*$/, "").trim();
}

function enforceSingleStatement(sql: string) {
  const semicolons = (sql.match(/;/g) ?? []).length;
  if (semicolons > 1) {
    throw new Error("Only one SQL statement is allowed.");
  }
  if (semicolons === 1 && !/;\s*$/.test(sql)) {
    throw new Error("Semicolon is only allowed at the end of the statement.");
  }
}

function hasLimit(sql: string) {
  return /\blimit\s+\d+/i.test(sql);
}

function getSqlKind(statement: string): SqlKind {
  if (/^(select|with)\b/i.test(statement)) return "select";
  if (/^explain\b/i.test(statement)) return "explain";
  return "write";
}

export function sanitizeSqlByMode(input: string, mode: SqlMode) {
  const normalized = normalizeSql(input);
  if (!normalized) {
    throw new Error("SQL is empty.");
  }

  enforceSingleStatement(normalized);
  const statement = stripTrailingSemicolon(normalized);

  const allowedStart = mode === "read" ? READ_ALLOWED_START : WRITE_ALLOWED_START;
  const forbidden = mode === "read" ? READ_FORBIDDEN : WRITE_FORBIDDEN;

  if (!allowedStart.test(statement)) {
    if (mode === "read") {
      throw new Error("Read mode only allows SELECT, WITH, or EXPLAIN.");
    }
    throw new Error("Write mode allows SELECT, WITH, EXPLAIN, INSERT, UPDATE, DELETE only.");
  }

  if (forbidden.test(statement)) {
    throw new Error("Forbidden SQL keyword detected.");
  }

  const kind = getSqlKind(statement);

  if (kind === "select" && !hasLimit(statement)) {
    return {
      sql: `SELECT * FROM (${statement}) AS devtools_q LIMIT ${MAX_ROWS}`,
      kind,
      normalized: statement,
    };
  }

  return {
    sql: statement,
    kind,
    normalized: statement,
  };
}

export function serializeSqlRows<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_, v) => {
      if (typeof v === "bigint") return v.toString();
      return v;
    }),
  ) as T;
}

export const SQL_MAX_ROWS = MAX_ROWS;
export const SQL_TIMEOUT_MS = 3000;
