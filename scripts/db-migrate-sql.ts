import { spawnSync } from "child_process";
import { existsSync } from "fs";
import { PrismaClient } from "@prisma/client";

const MIGRATION_FILE = "prisma/migrations/20260219110000_init/migration.sql";

async function ensurePgcrypto(prisma: PrismaClient) {
  const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM pg_extension
      WHERE extname = 'pgcrypto'
    ) AS exists;
  `;

  if (!rows[0]?.exists) {
    console.error("Missing required extension: pgcrypto.");
    console.error("Install it with a superuser before running migrations:");
    console.error(
      `psql "\${DATABASE_URL%%\\?*}" -c 'CREATE EXTENSION IF NOT EXISTS "pgcrypto";'`,
    );
    process.exit(1);
  }
}

async function shouldSkip(prisma: PrismaClient) {
  const rows = await prisma.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN (
        'USERS', 'BUSINESSES', 'FEEDBACKS', 'REACTIONS',
        'APP_ACCOUNTS', 'APP_SESSIONS', 'FRIENDSHIPS'
      );
  `;

  return rows.length === 7;
}

async function assertSchemaPrivileges(prisma: PrismaClient) {
  const rows = await prisma.$queryRaw<Array<{ usage_ok: boolean; create_ok: boolean }>>`
    SELECT
      has_schema_privilege(current_user, 'public', 'USAGE') AS usage_ok,
      has_schema_privilege(current_user, 'public', 'CREATE') AS create_ok;
  `;

  const status = rows[0];
  if (!status?.usage_ok || !status?.create_ok) {
    console.error("Insufficient privileges on schema public.");
    console.error("Required: USAGE + CREATE on schema public for the current DB user.");
    console.error(`Detected: usage=${Boolean(status?.usage_ok)} create=${Boolean(status?.create_ok)}`);
    process.exit(1);
  }
}

async function main() {
  if (!existsSync(MIGRATION_FILE)) {
    console.error(`Migration file not found: ${MIGRATION_FILE}`);
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    await assertSchemaPrivileges(prisma);
    await ensurePgcrypto(prisma);

    if (await shouldSkip(prisma)) {
      console.log("Schema already initialized. Skipping SQL migration.");
      return;
    }
  } finally {
    await prisma.$disconnect();
  }

  const res = spawnSync(
    "bash",
    ["-lc", `source /home/ami/.nvm/nvm.sh && npx prisma db execute --file ${MIGRATION_FILE} --schema prisma/schema.prisma`],
    { stdio: "inherit", encoding: "utf-8" },
  );

  if (res.status !== 0) {
    console.error("SQL migration failed.");
    console.error("If DB is partially initialized, inspect with: npm run db:inspect");
    process.exit(res.status ?? 1);
  }

  console.log("SQL migration applied successfully.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
