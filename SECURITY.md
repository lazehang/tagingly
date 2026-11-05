# Security Policy

## Supported versions

Security fixes are applied on the default branch of
[github.com/lazehang/tagingly](https://github.com/lazehang/tagingly).
There is no separate LTS release line at this time.

## Reporting a vulnerability

**Please do not open public GitHub issues for security vulnerabilities.**

Report sensitive issues privately by emailing the repository owner (see GitHub
profile for **lazehang**) or using GitHub **Private vulnerability reporting** if
enabled on the repository.

Include:

- Description and impact
- Steps to reproduce
- Affected paths or versions (commit SHA if possible)

We aim to acknowledge reports within a few business days. Coordinated disclosure
is appreciated.

## Deployment warnings (self-hosted and demos)

Tagingly processes **biometric data** (face embeddings and photos). Treat
deployments as high-sensitivity systems.

- **Never deploy with default seed credentials.** The local-only defaults in
  [`.env.example`](.env.example) (`admin@example.com` / `change-me-admin`) must
  be overridden before any network-exposed environment. See [`apps/api/prisma/seed.ts`](apps/api/prisma/seed.ts).
- **Use strong secrets.** Set long random values for `JWT_SECRET`, `AUTH_SECRET`,
  and object-storage keys. The API enforces only a minimum length on `JWT_SECRET`
  in development; production must exceed that.
- **Do not run a public demo without abuse controls.** Open registration and photo
  upload endpoints (`/auth/register`, event photo uploads) should be protected
  with rate limiting, CAPTCHA, or network restrictions before exposing to the
  open internet.
- **Lock down CORS** to your real web origin (`CORS_ORIGIN` on the API).
- **HTTPS** for both web and API in production.

See [`README.md`](README.md#before-your-first-production-deploy) (production checklist)
and [CONTRIBUTING.md](CONTRIBUTING.md) for local setup. Hosted SaaS (if offered
separately) is not described in this repository.
