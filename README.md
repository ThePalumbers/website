# The Palumbers

The Palumbers is a Yelp-like social platform built with Next.js App Router, Prisma, and PostgreSQL.
The homepage (`/`) is a splash screen, and clicking the splash image navigates to `/explore`.

## ✨ Features

- Splash homepage at `/` (no app navbar)
- Business discovery with search, filters, and pagination
- Business detail view with feedback, photos, hours, and check-ins
- Feedback creation:
  - ⭐ `review` with required rating
  - 💬 `tip` with `rating = null`
- 👍 Reactions on feedback with one reaction per user per feedback
- 🤝 Friendship workflow (`pending`, `accepted`, `rejected`)
- 📰 Social feed based on accepted friendships
- User profile page by username
- 🔐 Credentials auth with cookie-based sessions
- Dev-only internal tools at `/devtools`:
  - API Runner
  - DB Inspector (read-only)
  - SQL Console (read mode + guarded write mode)

## 🖼️ Screenshots

- Splash (`/`) — _placeholder_
- Explore (`/explore`) — _placeholder_
- Business detail (`/business/[id]`) — _placeholder_
- Friends and feed (`/friends`, `/feed`) — _placeholder_
- Devtools (`/devtools`) — _placeholder_

## 🧱 Tech Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Prisma ORM
- PostgreSQL
- Tailwind CSS
- shadcn-style UI components
- Zod validation
- bcryptjs for password hashing
- next-themes for theme handling

## 🗂️ Project Structure

```text
src/
  app/
    page.tsx                  # Splash homepage (/)
    (app)/                    # Main app routes (with Header + Shell)
      layout.tsx
      explore/
      business/[id]/
      feedback/[id]/
      feed/
      friends/
      u/[username]/
      auth/
      devtools/
    brand/                    # Redirect to /
    api/                      # Route handlers
  components/
    brand/
    layout/
    business/
    feedback/
    friends/
    devtools/
    ui/
  lib/
    db.ts
    auth.ts
    devtools.ts
    devtools-sql.ts
prisma/
  schema.prisma
  seed.ts
scripts/
  db-inspect.ts
  db-migrate-sql.ts
  db-counts.ts
```

## 🚀 Getting Started

### 📋 Prerequisites

- Node.js 20+
- npm
- PostgreSQL
- `psql` CLI

Install dependencies:

```bash
npm install
```

## 🔐 Environment Variables

Create your local env file:

```bash
cp .env.example .env
```

Example values:

```env
DATABASE_URL="postgresql://ThePalumberUser:somestrongpassword@localhost:5432/ThePalumbers?schema=public"
AUTH_SECRET="replace-with-a-long-random-secret"
DEVTOOLS_TOKEN="changeme_dev"
DEVTOOLS_SQL_ENABLED="0"
DEVTOOLS_SQL_WRITE_ENABLED="0"
MEM_DEBUG="0"
```

Variable meanings:

- `DATABASE_URL`: PostgreSQL connection string for Prisma
- `AUTH_SECRET`: app auth/session secret
- `DEVTOOLS_TOKEN`: unlock token for `/devtools`
- `DEVTOOLS_SQL_ENABLED`: enables SQL Console (`1`/`0`)
- `DEVTOOLS_SQL_WRITE_ENABLED`: enables SQL write mode (`1`/`0`)
- `MEM_DEBUG`: enables server memory/debug logs every 10s (`1`/`0`)

## 🗄️ Database Setup

### 1) Generate Prisma Client

```bash
npm run db:generate
```

### 2) Ensure `pgcrypto` is installed

Required before SQL migration:

```bash
psql "$DATABASE_URL" -c 'CREATE EXTENSION IF NOT EXISTS "pgcrypto";'
```

### 3) Apply SQL migration

```bash
npm run db:migrate:sql
```

### 4) Seed data and verify counts

```bash
npm run db:seed
npm run db:counts
```

Notes:

- Seed data is synthetic (not Yelp data).
- Seed is idempotent and fills each Prisma model to at least 20 records.

### 5) Optional: SSH tunnel for remote DB bound to loopback

If remote PostgreSQL listens only on `127.0.0.1`:

```bash
ssh -N -L 15432:127.0.0.1:5432 user@10.0.138.9
```

Then point `DATABASE_URL` to `localhost:15432`.

## ▶️ Run the App

Development:

```bash
npm run dev
```

Production build/start:

```bash
npm run build
npm run start
```

## 🔌 API Overview

Base URL: `http://localhost:3000`

### Core

- `GET /api/ping`
- `GET /api/health`

### 🔐 Auth

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Businesses

- `GET /api/businesses?query=&city=&category=&tag=&openNow=&minRating=&page=&limit=`
- `GET /api/businesses/[id]`
- `GET /api/businesses/[id]/feed?page=&limit=`

### ⭐ Feedback and 👍 Reactions

- `POST /api/feedback`
- `POST /api/reactions`

### 🤝 Friendships and 📰 Feed

- `POST /api/friendships/request`
- `POST /api/friendships/respond`
- `GET /api/friendships`
- `GET /api/friendships/pending`
- `GET /api/feed?page=&limit=`

### Users

- `GET /api/users/[username]`

### 🛠️ Devtools APIs (development only)

- `POST /api/devtools/unlock`
- `GET /api/devtools/db/overview`
- `GET /api/devtools/db/search-business?query=&city=&limit=`
- `GET /api/devtools/db/business/[id]`
- `GET /api/devtools/db/user/[usernameOrId]`
- `GET /api/devtools/db/checks`
- `POST /api/devtools/sql`

## 🧪 Quick Smoke Tests

```bash
curl -s http://localhost:3000/api/ping
curl -s http://localhost:3000/api/health
curl -s "http://localhost:3000/api/businesses?page=1&limit=10"
```

```bash
curl -s -c cookie.txt -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"smoke_user","email":"smoke_user@palumbers.dev","password":"password123"}'

curl -s -c cookie.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"smoke_user@palumbers.dev","password":"password123"}'

curl -s -b cookie.txt http://localhost:3000/api/auth/me
```

```bash
curl -s -b cookie.txt "http://localhost:3000/api/feed?page=1&limit=10"
```

## 🛠️ Devtools

Route: `/devtools`

- Available in development only
- Requires unlock token (`DEVTOOLS_TOKEN`)
- Uses a `devtools=1` cookie gate

### 🧭 API Runner

- Calls internal `/api/*` routes
- Supports method/path/headers/body
- Includes presets and saved requests

### 🔎 DB Inspector (read-only)

- Overview KPI cards
- Business/user lookup
- Data integrity checks

### 🧾 SQL Console (dev only)

Environment flags:

```env
DEVTOOLS_SQL_ENABLED=1
DEVTOOLS_SQL_WRITE_ENABLED=1
```

Security notes:

- SQL Console is disabled unless `DEVTOOLS_SQL_ENABLED=1`
- Write mode is disabled unless `DEVTOOLS_SQL_WRITE_ENABLED=1`
- Read mode allows only `SELECT`, `WITH`, `EXPLAIN`
- Write mode allows only `INSERT`, `UPDATE`, `DELETE`
- DDL/DCL-like operations are blocked
- Single statement per execution
- Low statement timeout is enforced
- Write preview rolls back by default
- Commit is explicit and separate

> Warning: Devtools and SQL Console are strictly for local/development usage.

## 🧯 Troubleshooting

### 1) `allowedDevOrigins` warning on `http://someLAN-IP:3000`

If you run the dev server via IP/host instead of localhost, make sure your dev origin/host configuration and browser URL are aligned.

### 2) PostgreSQL listens on `127.0.0.1`

If DB access is remote but loopback-bound, use an SSH tunnel (`ssh -L 15432:127.0.0.1:5432 ...`) or reconfigure PostgreSQL `listen_addresses` and `pg_hba.conf` safely for your environment.

### 3) Prisma Client type mismatch

Regenerate Prisma Client:

```bash
npm run db:generate
```

Then rerun migration/seed if needed.

### 4) Debug memory (dev-only) (`MEM_DEBUG=1`)

Run with memory instrumentation enabled:

```bash
MEM_DEBUG=1 npm run dev
```

```bash
MEM_DEBUG=1 npm run build
MEM_DEBUG=1 npm run start
```

Or set MEM_DEBUG=1 in your .env file.

You will see periodic logs with `rss`, `heapUsed`, `heapTotal`, `external`, and active timer/handle counters.

Quick checks:

```bash
ps -o pid,rss,command -C node
```

In browser DevTools, check the Network tab for repeated/looping requests while idle.

## 🗺️ Roadmap

- Add automated API/UI test coverage
- Improve observability around social workflows and devtools
- Harden environment-specific access controls

## 📄 License

© 2026 ThePalumbers. All rights reserved.
