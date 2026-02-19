import { existsSync } from "fs";
import { spawnSync } from "child_process";
import { PrismaClient } from "@prisma/client";

function findPsql() {
  const candidates = ["/usr/bin/psql", "/bin/psql"];
  for (const path of candidates) {
    if (existsSync(path)) return path;
  }
  const probe = spawnSync("bash", ["-lc", "command -v psql"], { encoding: "utf-8" });
  return probe.status === 0 ? probe.stdout.trim() : "";
}

function runWithPsql(psqlPath: string, databaseUrl: string) {
  const url = new URL(databaseUrl);
  url.searchParams.delete("schema");

  const sql = `
SELECT current_user, current_database(), current_schema();
SELECT table_name
FROM information_schema.tables
WHERE table_schema='public'
ORDER BY table_name;
`;

  const res = spawnSync(psqlPath, [url.toString(), "-v", "ON_ERROR_STOP=1", "-c", sql], {
    encoding: "utf-8",
    stdio: "inherit",
  });

  if (res.status !== 0) {
    process.exit(res.status ?? 1);
  }
}

async function runWithPrisma() {
  const prisma = new PrismaClient();
  try {
    const who = await prisma.$queryRaw<Array<{ current_user: string; current_database: string; current_schema: string }>>`
      SELECT current_user, current_database(), current_schema();
    `;

    const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema='public'
      ORDER BY table_name;
    `;

    const info = who[0];
    console.log("current_user:", info?.current_user ?? "n/a");
    console.log("current_database:", info?.current_database ?? "n/a");
    console.log("current_schema:", info?.current_schema ?? "n/a");
    console.log("public tables:");

    if (!tables.length) {
      console.log("(none)");
      return;
    }

    for (const row of tables) {
      console.log(`- ${row.table_name}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const psqlPath = findPsql();
  if (psqlPath) {
    runWithPsql(psqlPath, databaseUrl);
    return;
  }

  await runWithPrisma();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
