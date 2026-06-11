<div align="center">
  <img src="public/logo.png" alt="GigFin" width="72" />
  <h1>GigFin</h1>
  <p><strong>A self-hosted, privacy-first income &amp; expense ledger for gig-economy workers.</strong></p>
</div>

GigFin helps delivery / rideshare / freelance workers track earnings across
platforms, log expenses and mileage, see live dashboards, estimate tax, and
keep everything on infrastructure they control.

A hosted demo lives at **[gigfin.me](https://gigfin.me)** — but GigFin is
designed to be **deployed by you**. It is **air-gap first**: the only hard
dependency is a self-hosted
[Convex](https://www.convex.dev) backend that ships in the compose stack, and
every optional integration is off unless you configure it. GigFin runs fully on
a private network with no internet access.

## Features

- **Income, expenses, mileage & shifts** — reactive logs (live updates, no refresh).
- **Dashboard** — monthly income-vs-expenses chart, platform/category breakdowns,
  effective £/hour, goals & budgets with progress.
- **Tax estimator** — jurisdiction-aware (UK Self-Assessment / US Schedule C),
  with mileage allowance. Computed locally; it's an estimate, not advice.
- **Tax-year reports** — printable / save-as-PDF summaries.
- **Recurring expenses** — auto-logged on schedule by an in-backend cron.
- **Receipts** — image attachments in the self-hosted file storage (no S3).
- **CSV import/export** and one-click in-app migration from GigFin v1.
- **Auth** — email/password + TOTP two-factor + session management (Better Auth).
- **PWA**, light/dark themes, mobile-friendly.

## Self-hosting (Docker Compose)

Requires Docker + Docker Compose.

```bash
git clone https://github.com/sayedhfatimi/gigfin.git
cd gigfin
cp .env.example .env

# 1. Start the Convex backend and generate an admin key
docker compose up -d backend
docker compose exec backend ./generate_admin_key.sh
#   → copy the printed key into .env as CONVEX_SELF_HOSTED_ADMIN_KEY

# 2. Set the required vars in .env:
#    - CONVEX_SELF_HOSTED_ADMIN_KEY (from above)
#    - CONVEX_URL / CONVEX_SITE_URL  (how the BROWSER reaches the backend)
#    - SITE_URL                      (public app URL)
#    - BETTER_AUTH_SECRET            (openssl rand -base64 32)

# 3. Start everything (builds the app image on first run)
docker compose up -d
```

GigFin is now on `http://localhost:3000` (or your `SITE_URL`). The app container
deploys its Convex functions to the backend on start. To use the prebuilt image
instead of building locally, `docker compose pull` first — images are published
to `ghcr.io/sayedhfatimi/gigfin`.

Optional: the Convex admin dashboard is available with the `dashboard` profile:
`docker compose --profile dashboard up -d` (port 6791).

## Migrating from GigFin v1

GigFin v2 is a ground-up rewrite and is **not a drop-in upgrade** from v1: v1
stored data in a local SQLite database (Drizzle), whereas v2 uses Convex. The two
are **not compatible** — you don't point v2 at a v1 database, you import it.

To bring your v1 ledger across:

1. Deploy v2 and create an account.
2. Go to **Settings → Data → Migrate from GigFin v1**.
3. Upload your v1 `db.sqlite` file.

The file is parsed **locally in your browser** (nothing is uploaded anywhere) and
your income, expenses, mileage, vehicles and charging vendors are imported into
your account. Money is converted to integer minor units automatically.

Operators who prefer the command line can use `scripts/migrate-sqlite.ts` instead.

What does **not** carry over: accounts / passwords, two-factor, sessions, and
app preferences (currency / units / tax jurisdiction) — set those up fresh in v2.

## Configuration

| Variable | Required | Purpose |
| --- | --- | --- |
| `CONVEX_SELF_HOSTED_URL` | ✓ | Backend address for the deploy CLI (compose sets this internally) |
| `CONVEX_SELF_HOSTED_ADMIN_KEY` | ✓ | Admin key from `generate_admin_key.sh` |
| `CONVEX_URL` / `CONVEX_SITE_URL` | ✓ | Browser-reachable backend URLs (site = API port + 1) |
| `SITE_URL` | ✓ | Public app URL |
| `BETTER_AUTH_SECRET` | ✓ | Auth signing secret (`openssl rand -base64 32`) |
| `RESEND_API_KEY` | — | Enables email (password reset/verification). Omit to disable. |
| `GIGFIN_DISABLE_SIGNUP` | — | Set to `true` to lock registration to existing users |
| `ANALYTICS_SCRIPT_URL` / `ANALYTICS_SITE_ID` | — | Privacy-friendly analytics. Omit to disable. |

## Air-gap / offline

GigFin needs no internet at runtime. The backend's anonymous telemetry beacon is
disabled (`DISABLE_BEACON=true`) in the compose file. Without `RESEND_API_KEY`,
password recovery uses offline recovery codes (no email). Files (receipts) are
stored locally in the backend volume.

## Backup & restore

All data lives in the `data` Docker volume (SQLite + file storage). Back it up
with the Convex self-hosted snapshot export, or by snapshotting the volume while
the stack is stopped. See the
[Convex self-hosting docs](https://github.com/get-convex/convex-backend/tree/main/self-hosted).

## Local development

```bash
bun install
docker compose up -d backend            # the Convex backend
cp .env.example .env.local              # set NEXT_PUBLIC_* + admin key
bunx convex dev                          # terminal 1 — sync functions
bun run dev                              # terminal 2 — http://localhost:3000
```

Quality checks: `bun run lint`, `bunx tsc --noEmit`, `bun run test`, `bun run build`.

## Tech stack

Next.js 16 (App Router) · self-hosted Convex · Better Auth · Tailwind v4 ·
shadcn/ui (Base UI) · Biome · bun.

## License

[MIT](LICENSE)
