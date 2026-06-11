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

## Deployment

GigFin ships as one prebuilt multi-arch image (`ghcr.io/sayedhfatimi/gigfin`)
plus a self-hosted Convex backend. The **same `docker-compose.yml`** covers both a
private-network box and public infrastructure — only a couple of env vars differ.
You set at most five vars; `scripts/setup.sh` generates the three secrets for you.

Requires Docker + Docker Compose.

### Path A — Self-host on a private network / LAN

```bash
git clone https://github.com/sayedhfatimi/gigfin.git
cd gigfin

# 1. Generate the three required secrets into .env
sh scripts/setup.sh

# 2. (LAN only) point browsers at this host — edit .env:
#    CONVEX_PUBLIC_URL=http://<lan-ip>:3210
#    SITE_URL=http://<lan-ip>:3000
#    (skip for a single machine — the localhost defaults already work)

# 3. Start everything
docker compose up -d
```

Open `SITE_URL` and sign up. The app deploys its Convex functions to the backend on
first boot — there is **no second "generate key / redeploy" step**.

### Path B — Public infrastructure (Coolify example, `gigfin.me`)

1. New resource → **Docker Compose (empty)** → paste this repo's `docker-compose.yml`.
2. Run `sh scripts/setup.sh` on any machine with Docker + openssl (it doesn't deploy
   anything — it just prints three portable secrets). Paste the three printed lines
   (`BETTER_AUTH_SECRET`, `CONVEX_INSTANCE_SECRET`, `CONVEX_SELF_HOSTED_ADMIN_KEY`)
   into Coolify's **Environment** UI, plus:
   - `CONVEX_PUBLIC_URL=https://convex.gigfin.me`
   - `SITE_URL=https://gigfin.me`
3. Assign one domain per service (Coolify allows one each — that's all you need):
   - `gigfin.me` → **gigfin** service, port `3000`
   - `convex.gigfin.me` → **convex** service, port `3210`
   - *(optional)* `convex-dash.gigfin.me` → **convex-dashboard** service, port `6791`

   Only the Convex **cloud** port (3210) is ever browser-facing; the site port (3211)
   stays internal, so a single domain per service is sufficient.
4. Deploy — Coolify **pulls** the prebuilt image from GHCR.

> **Dashboard access:** the Convex dashboard requires your deployment URL +
> `CONVEX_SELF_HOSTED_ADMIN_KEY` to log in, so it is not open to the public. Exposing
> it on a domain is optional — you can also leave it unmapped and reach it over an SSH
> tunnel. Either way, keep the admin key secret.

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `BETTER_AUTH_SECRET` | ✓ | Session signing secret (from `scripts/setup.sh`) |
| `CONVEX_INSTANCE_SECRET` | ✓ | Pins the backend instance so the admin key stays valid (from `scripts/setup.sh`) |
| `CONVEX_SELF_HOSTED_ADMIN_KEY` | ✓ | Lets the app deploy Convex functions (from `scripts/setup.sh`) |
| `CONVEX_PUBLIC_URL` | ✓ | Where the **browser** reaches the Convex backend (3210). Local default works. |
| `SITE_URL` | ✓ | Public URL of the app. Local default works. |
| `RESEND_API_KEY` | — | Enables email (password reset/verification). Omit to disable. |
| `GIGFIN_DISABLE_SIGNUP` | — | Set to `true` to lock registration to existing users |
| `ANALYTICS_SCRIPT_URL` / `ANALYTICS_SITE_ID` | — | Privacy-friendly analytics. Omit to disable. |
| `POSTGRES_URL` | — | External Postgres for the backend instead of the bundled SQLite volume |

Advanced/internal overrides (the `backend:*` URLs, instance name, host ports) are
fixed in `docker-compose.yml` and normally untouched — see the comments there.

### Updating

```bash
docker compose pull && docker compose up -d   # or redeploy in Coolify
```

### Build from source (optional)

```bash
docker compose -f docker-compose.yml -f docker-compose.build.yml up -d --build
```

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

## Air-gap / offline

GigFin needs no internet at runtime. The backend's anonymous telemetry beacon is
disabled (`DISABLE_BEACON=true`) in the compose file. Without `RESEND_API_KEY`,
password recovery uses offline recovery codes (no email). Files (receipts) are
stored locally in the backend volume.

## Backup & restore

All data lives in the `gigfin-convex-data` Docker volume (SQLite + file storage). Back
it up with the Convex self-hosted snapshot export, or by snapshotting the volume while
the stack is stopped. See the
[Convex self-hosting docs](https://github.com/get-convex/convex-backend/tree/main/self-hosted).

## Local development

```bash
bun install
docker compose up -d convex             # the Convex backend
# .env.local sets NEXT_PUBLIC_CONVEX_URL / CONVEX_PUBLIC_URL (= 127.0.0.1:3210),
# the admin key, and BETTER_AUTH_SECRET. Generate an admin key with:
#   docker compose exec convex ./generate_admin_key.sh
bunx convex dev                          # terminal 1 — sync functions
bun run dev                              # terminal 2 — http://localhost:3000
```

Quality checks: `bun run lint`, `bunx tsc --noEmit`, `bun run test`, `bun run build`.

## Tech stack

Next.js 16 (App Router) · self-hosted Convex · Better Auth · Tailwind v4 ·
shadcn/ui (Base UI) · Biome · bun.

## License

[MIT](LICENSE)
