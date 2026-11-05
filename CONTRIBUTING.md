# Contributing to Tagingly

Thank you for your interest in Tagingly! This repository is **open-core**:
source is MIT-licensed (see [`LICENSE`](LICENSE)); a separately hosted product
may exist with additional services not in this repo.

## Prerequisites

- **Node.js** ≥ 20.9
- **npm** 9+ (workspaces)
- **Docker** and Docker Compose (PostgreSQL + Weaviate for local dev)

## Local setup

1. Clone the repository and install from the **monorepo root**:

   ```bash
   git clone https://github.com/lazehang/tagingly.git
   cd tagingly
   npm install
   ```

2. Start data services:

   ```bash
   docker compose up -d
   ```

3. Configure the API — copy [`.env.example`](.env.example) to `apps/api/.env`
   and set at least `DATABASE_URL`, `JWT_SECRET`, and `WEAVIATE_URL`
   (`http://localhost:8081` matches Compose).

4. Push schema and seed (local admin only):

   ```bash
   cd apps/api && npx prisma db push && npm run db:seed
   ```

5. Configure the web app — create `apps/web/.env.local` with `AUTH_SECRET`,
   `NEXTAUTH_URL=http://localhost:3001`, `API_URL`, and `NEXT_PUBLIC_API_URL`
   (see `.env.example`).

6. Run development servers from the repo root:

   ```bash
   npm run dev --workspace=api
   npm run dev --workspace=web
   ```

   Or `npm run dev` to run all workspace `dev` tasks via Turbo.

Full workflow details are in [`README.md`](README.md).

## Before opening a pull request

From the repository root:

```bash
npm run lint
npm run check-types
npm run build
```

CI runs the same checks on GitHub Actions. The build does not require a live
Weaviate instance or face model weights (API build uses `prisma generate` and
TypeScript compile only).

## Code style

- ESLint and Prettier configs live under `packages/eslint-config`.
- Prefer minimal, focused diffs; match existing patterns in each app.

## Security

See [`SECURITY.md`](SECURITY.md) before deploying any fork publicly.

## Questions

Open a [GitHub Discussion](https://github.com/lazehang/tagingly/discussions) or
issue for bugs and feature ideas. For security issues, follow `SECURITY.md`.
