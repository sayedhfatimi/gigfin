# GigFin — Agent Guide

GigFin is a **self-hosted, air-gappable** income/expense ledger for gig-economy workers
(delivery / rideshare / freelance). Next.js 16 (App Router) + **self-hosted Convex** +
Better Auth + shadcn/ui (Base UI variant). This is a greenfield rewrite of the original
SQLite/Drizzle implementation (kept at `../gigfin-old`).

## Core design principle: air-gap first

GigFin MUST run fully on a private network with **no internet egress**. Self-hosted Convex
is the only hard dependency (shipped in the compose stack). **Every** outward integration
(email, analytics, anything added later) is:

- **off unless its env vars are set**,
- degrades gracefully (UI hides/disables it; backend no-ops or throws a friendly error),
- never on the critical path.

`lib/features.ts` is the single place that reads env and exposes capability flags. Route all
optional-integration gating through it. This pattern is the template for any future integration.

## Package manager

Use **bun** exclusively (never npm/yarn/pnpm). `bun install`, `bun add <pkg>`, `bun run <script>`.
Commit `bun.lock`.

## Quality checks

| Command | What it does |
| --- | --- |
| `bun run dev` | Next.js dev server |
| `bun run build` | Production build |
| `bun run lint` | `biome check` |
| `bun run format` | `biome format --write` |
| `tsc --noEmit` | Type check |
| `bun run test` | `vitest run` (incl. `convex-test` for Convex functions) |

All four (lint, typecheck, test, build) must be green before a release.

## Convex conventions

- Schema in `convex/schema.ts` via `defineSchema`/`defineTable`; index common query paths
  (`by_user`, `by_user_date`, `by_user_type`). Use literal-union validators for enum-like fields.
- Domain modules split by feature with thin aggregator re-exports to preserve `api.<module>.<fn>` callsites.
- Every query/mutation is **ownership-gated**: use `getAuthedUserId(ctx)` and `requireOwner(ctx, doc)`.
  Never trust an implicit `userId` filter alone.
- User-facing failures: `throw new ConvexError({ code, message })`. Programmer errors: `throw new Error(...)`.
- `convex/_generated` is committed and Biome-ignored. **Never hand-edit it.**

### Regenerating Convex types

Codegen needs a running backend (there is no always-on dev deployment — it fails
offline). After any change to `convex/schema.ts` or a Convex function signature:

1. Start only the self-hosted Convex backend from the compose stack:
   `docker compose up -d convex`
   Wait until healthy: `docker compose ps` shows `convex` healthy, or
   `curl -f http://127.0.0.1:3210/version` succeeds.
2. Push functions + regenerate `convex/_generated`:
   `bunx convex dev --once`
   This reads `CONVEX_SELF_HOSTED_URL` (http://127.0.0.1:3210) and
   `CONVEX_SELF_HOSTED_ADMIN_KEY` from `.env.local`.
3. Commit the regenerated `convex/_generated/*` alongside the change.

If `bunx convex dev --once` cannot reach the backend or auth fails (admin key vs
the volume's `INSTANCE_SECRET` mismatch), fix the backend — do NOT hand-edit the
generated files.

## Validation

- Convex `v` validators validate function args at the data boundary.
- Shared input contracts: define Zod schemas once in `lib/schemas/`, derive Convex validators with
  `convex-helpers` (`zodToConvex` / `zCustomMutation`), and reuse the same Zod schema in shadcn `Form`
  + react-hook-form. Single source of truth — no Drizzle, no ad-hoc `if` checks.

## Money & dates

- **All money is integer minor units** (pence/cents). Format only at the display boundary.
- Dates are ISO `YYYY-MM-DD` strings with consistent field naming across tables.

## Components

- shadcn/ui Base UI variant (`components.json` → `style: "base-nova"`, `@base-ui/react`, lucide icons).
- UI primitives in `components/ui/`; domain components in `components/<feature>/`; layout in
  `components/layout/`. Route-scoped components under `app/.../_components/`.

## Commits & releases

- Conventional commits: `feat|fix|chore|refactor|docs|test|perf|ci(scope): subject`.
- **Version bump + tag go in their own commit**, never bundled with implementation. Bump
  `package.json` (runtime reads version from it), commit, then `git tag vX.Y.Z`.
- Push commits touching `.github/workflows/**` over **SSH** (the gh HTTPS token lacks `workflow` scope).
- Tagged `v*` builds publish a `linux/amd64` GHCR image; CI enforces tag == `package.json` version.

## Migration

`scripts/migrate-sqlite.ts` does a one-time import from `~/db.sqlite` (the original instance) into
self-hosted Convex. See `docs/` and the rewrite plan for the credential-portability details.
