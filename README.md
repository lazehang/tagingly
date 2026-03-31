# Photo Tagging AI

Monorepo for an event photo platform: organizers create events and upload crowd photos; attendees register with a selfie; the API detects faces, matches them to embeddings in **Weaviate**, and stores originals in **local disk** or **Backblaze B2**. Attendees see a gallery of shots they appear in via signed URLs.

Built with [Turborepo](https://turbo.build/repo), **Next.js** (App Router), **Express**, **Prisma** (PostgreSQL), **face-api.js** + **TensorFlow.js Node**, and **Auth.js** (NextAuth v5) for credentials-based sign-in.

## Requirements

- **Node.js** ≥ 20.9 (Next.js 16 and current AWS SDK expect this)
- **Docker** and Docker Compose (for PostgreSQL and Weaviate locally)
- **npm** 9+ (workspace root uses `npm` workspaces)

Optional for production uploads: a **Backblaze B2** bucket and S3-compatible credentials.

## Repository layout

| Path | Role |
|------|------|
| [`apps/web`](apps/web) | Next.js UI: admin dashboard, attendee registration, portal, Auth.js |
| [`apps/api`](apps/api) | Express API: auth, events, uploads, face pipeline, Weaviate, storage |
| [`packages/types`](packages/types) | Shared TypeScript DTOs for API and web |
| [`packages/ui`](packages/ui) | Shared React primitives (buttons, cards, inputs, modal) |
| [`packages/tailwind-config`](packages/tailwind-config) | Shared Tailwind preset and CSS variables |
| [`packages/eslint-config`](packages/eslint-config), [`packages/typescript-config`](packages/typescript-config) | Lint and TS bases |

## Quick start

1. **Install dependencies** (from the repo root):

   ```bash
   npm install
   ```

2. **Start databases** (PostgreSQL + Weaviate):

   ```bash
   docker compose up -d
   ```

3. **Configure the API** — copy [`.env.example`](.env.example) to `apps/api/.env` and set at least:

   - `DATABASE_URL` — default in `.env.example` matches `docker-compose.yml`
   - `JWT_SECRET` — long random string
   - `USE_LOCAL_STORAGE=true` for local development (no B2 required)

4. **Apply schema and seed an admin user**:

   ```bash
   cd apps/api && npx prisma db push && npm run db:seed
   ```

   Default admin (override with `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` in `apps/api/.env` before seeding):

   - Email: `admin@example.com`
   - Password: `change-me-admin` (from `.env.example`)

5. **Configure the web app** — create `apps/web/.env.local`:

   ```bash
   AUTH_SECRET=$(openssl rand -base64 32)
   ```

   Minimum variables:

   - `AUTH_SECRET` — required by Auth.js (or use `NEXTAUTH_SECRET`)
   - `NEXTAUTH_URL=http://localhost:3000`
   - `API_URL=http://localhost:4000` — server-side calls to the API
   - `NEXT_PUBLIC_API_URL=http://localhost:4000` — browser calls to the API

6. **Run apps** — from the repo root, in two terminals:

   ```bash
   npm run dev --workspace=api
   ```

   ```bash
   npm run dev --workspace=web
   ```

   Or run everything with Turbo (all `dev` scripts concurrently):

   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000). Sign in as admin at `/login`, create an event, copy its ID for `/register?eventId=…`, then upload photos under **Admin → Manage** for that event.

## End-to-end workflow

1. **Admin** creates an event and shares its **event ID** (or the registration link from the dashboard).
2. **Attendees** open **Register**, enter the event ID, name, email, password, and a clear **selfie**. The API stores the image, extracts a face embedding, and upserts it into Weaviate scoped by `eventId`.
3. **Admin** uploads **event photos** for that event. Each image is stored, then processed asynchronously: faces are detected, embeddings queried against Weaviate (selfies for the same event), and matching user IDs are written to `Photo.taggedUserIds`.
4. **Attendees** sign in and open **Portal** to see **tagged photos** (signed URLs; local mode uses JWT-backed `/blobs` on the API).

## Environment variables

See [`.env.example`](.env.example) for the full list. Summary:

**API (`apps/api/.env`)**

- `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`
- `WEAVIATE_URL` (default `http://localhost:8080` with Compose)
- Storage: `USE_LOCAL_STORAGE=true` **or** B2 (`B2_*`, `B2_ENDPOINT`, etc.)
- `API_PUBLIC_URL` — optional; base URL embedded in local signed blob links (defaults to `http://localhost:${PORT}`)
- `SIGNED_URL_TTL_SECONDS`

**Web (`apps/web/.env.local`)**

- `AUTH_SECRET`, `NEXTAUTH_URL`
- `API_URL`, `NEXT_PUBLIC_API_URL`

OAuth providers are not wired to the Express API in the default setup; sign-in is **email + password** against `/auth/login`.

## Scripts (root)

| Command | Description |
|---------|-------------|
| `npm run dev` | Turbo: all packages’ `dev` tasks |
| `npm run build` | Production builds |
| `npm run lint` | ESLint across workspaces |
| `npm run check-types` | `tsc --noEmit` where configured |
| `npm run format` | Prettier for TS/TSX/MD |

**API workspace**

- `npm run dev --workspace=api` — `tsx watch`
- `npm run build --workspace=api` — `prisma generate` + `tsc`
- `npm run db:push --workspace=api` / `db:seed` / `db:generate`

**Web workspace**

- `npm run dev --workspace=web` — Next.js on port 3000

## Docker

- [`docker-compose.yml`](docker-compose.yml) — **postgres** (16) and **weaviate** (1.27) with volumes.
- [`apps/api/Dockerfile`](apps/api/Dockerfile) — example production image; build from repo root:  
  `docker build -f apps/api/Dockerfile .`

## Deployments and hosting

Production is **three moving parts** plus data services: the **Next.js app** (`apps/web`), the **Express API** (`apps/api`), and shared infrastructure (**PostgreSQL**, **Weaviate**, object storage). They can live on different providers as long as URLs and CORS line up.

### What to run where

| Component | Typical hosting | Notes |
|-----------|-----------------|--------|
| **Web** | [Vercel](https://vercel.com), [Netlify](https://www.netlify.com), or any Node host | Stateless; set env vars in the provider UI. Use the **public** site URL for `NEXTAUTH_URL`. |
| **API** | **Docker** on a VM, [Fly.io](https://fly.io), [Railway](https://railway.app), [Render](https://render.com), [Google Cloud Run](https://cloud.google.com/run) (with enough CPU/memory), etc. | Needs **Node ≥ 20**, persistent or attached storage only if you insist on `USE_LOCAL_STORAGE` (not recommended in prod). Native libs (`canvas`, `tfjs-node`) favor **Linux x86_64/ARM64 images** built from [`apps/api/Dockerfile`](apps/api/Dockerfile). |
| **PostgreSQL** | [Neon](https://neon.tech), [Supabase](https://supabase.com), [RDS](https://aws.amazon.com/rds/), [Cloud SQL](https://cloud.google.com/sql), managed Postgres on your host | Put the connection string in `DATABASE_URL`. Prefer **`prisma migrate deploy`** for production schema changes (add migrations when you move beyond `db push`). |
| **Weaviate** | [Weaviate Cloud](https://weaviate.io/cloud), or self-hosted ([Docker](https://weaviate.io/developers/weaviate/installation/docker-compose)) | Set `WEAVIATE_URL` (and `WEAVIATE_API_KEY` if the cluster requires it). The API creates the `FaceEmbedding` class on startup. |
| **File storage** | **Backblaze B2** (S3-compatible) recommended | Set `USE_LOCAL_STORAGE=false` (or unset) and configure all `B2_*` variables. Without B2, the API falls back to disk under `apps/api/data/blob`, which does not scale across replicas unless you use a shared volume. |

### Build commands (monorepo)

From the repository root, after `npm ci`:

```bash
npm run build --workspace=web
npm run build --workspace=api
```

Or `npm run build` at the root to run Turbo `build` for all packages that define it. CI should install once at the root so workspaces resolve `@repo/*` correctly.

### Environment variables in production

**Web** — mirror local names but use **HTTPS** URLs:

- `NEXTAUTH_URL` — canonical public origin of the site (e.g. `https://app.example.com`)
- `AUTH_SECRET` — strong secret; rotate if compromised
- `NEXT_PUBLIC_API_URL` — public URL of the API (browser fetches)
- `API_URL` — same or internal URL if your host can reach the API over a private network (server components / Auth callbacks)

**API**

- `DATABASE_URL`, `JWT_SECRET`, `WEAVIATE_URL` (and API key if needed)
- `CORS_ORIGIN` — exact web origin (e.g. `https://app.example.com`), no trailing slash mismatch
- B2 (or compatible S3) when not using local disk
- `API_PUBLIC_URL` — **public base URL of this API** so JWT blob links in local-storage mode point somewhere valid; with B2, presigned URLs are generated instead
- `PORT` — many PaaS set this automatically; bind the process to `process.env.PORT` (the template already uses `loadEnv().PORT`)

### Operational checklist

1. **HTTPS** on both web and API in production.
2. **CORS** — only allow your real front-end origin(s).
3. **Secrets** — never commit `.env`; use provider secret managers.
4. **Admin bootstrap** — run `db:seed` once in the deployment environment (or create admin via a one-off job); change default passwords immediately.
5. **Face pipeline** — the API is CPU-heavy during uploads; size instances accordingly (or queue processing in a worker later).
6. **Scaling the API** — multiple replicas are safe for HTTP **if** storage is **B2** (or shared object storage) and not local disk; Weaviate and Postgres are shared across instances.

### Example: Vercel (web) + Fly.io (API)

1. Create Postgres and Weaviate Cloud (or self-host Weaviate) and a B2 bucket; note URLs and keys.
2. Deploy **API** from the repo with Docker (`fly launch` using [`apps/api/Dockerfile`](apps/api/Dockerfile)), set all API env vars, expose HTTPS.
3. Connect the **web** project to the repo, set root directory to `apps/web` (or build from monorepo root with `turbo` / `npm run build --workspace=web`), set web env vars to the deployed API URL.
4. Redeploy web after API URL is stable so `NEXT_PUBLIC_API_URL` matches.

Exact clicks differ per provider; the invariants are **public API URL**, **matching CORS**, **Auth.js URL**, and **managed DB + Weaviate + B2** for anything beyond a single-node demo.

## Face recognition and native dependencies

The API uses **@tensorflow/tfjs-node**, **face-api.js**, and **canvas**. On macOS you may need [system deps for `canvas`](https://github.com/Automattic/node-canvas#compiling); first run downloads model weights into `apps/api/face-models/` (gitignored).

If initialization fails, photo processing falls back to marking photos as failed; check API logs.

## Troubleshooting

- **CORS errors** — set `CORS_ORIGIN` on the API to the exact web origin (e.g. `http://localhost:3000`).
- **Weaviate errors** — ensure Compose is up and `WEAVIATE_URL` matches; the API creates the `FaceEmbedding` class on startup.
- **NextAuth / “not callable”** — do not add a file named `next-auth.d.ts` at the web app root; it can shadow the real `next-auth` package. Session/JWT extensions live under [`apps/web/types/`](apps/web/types/).
- **TypeScript “ambiguous project root” in `@repo/ui`** — `packages/ui/tsconfig.json` sets `rootDir: "src"`.
