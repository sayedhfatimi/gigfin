![GigFin logo](/logo.png)

# GigFin

GigFin helps gig workers keep a simple, reliable ledger of their tips, bonuses, and invoices alongside monthly trends and platform breakdowns. It combines a responsive Next.js dashboard with Better Auth–powered credential login, 2FA, and a fast SQLite + Drizzle ORM backend so you can log earnings securely from any device.

## What’s inside

- **Feature-rich dashboard:** Totals, average‑per‑day, and platform mix charts plus recent daily summaries give quick insight into your hustle.
- **Log & filter rentry history:** Add income per platform and filter by months or platforms to compare runs.
- **Local persistence:** Drizzle + SQLite stores every entry in `/app/data/db.sqlite`, so the Docker stack keeps state in a named volume.
- **Security-first auth:** Credential login, signup, and optional 2FA flows powered by Better Auth keep sessions locked down.
- **Theming & accessibility:** Adaptive light/dark styles bring clarity to the hero copy, quick add forms, and stats view.

## Tech stack

- **Next.js 16** (App Router) & **React 19**
- **Drizzle ORM / Drizzle-Kit** for migrations and SQLite helpers
- **better-auth** for token management, signup/login, and Two-Factor Auth
- **TanStack Query & Table**, **Recharts**, and **DaisyUI/Tailwind** for the UI surfaces

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` (if provided) or create your own `.env` with:

   ```env
   DB_FILE_NAME=file:./data/db.sqlite
   BETTER_AUTH_SECRET=your-secret
   BETTER_AUTH_URL=http://localhost:3000
   ```

3. Generate the SQLite schema:

   ```bash
   npx drizzle-kit migrate
   ```

4. Start the dev server:

   ```bash
   npm run dev
   ```

   Next.js watches your changes and reloads the page automatically. Open http://localhost:3000 in a browser to log in or sign up as a gig worker.

## Build & test

- Run `npm run build` to compile the app for production; the Docker build stage already runs this.
- Run `npm run lint` to validate formatting and coding standards via Biome.

## Environment variables

GigFin expects:

- `DB_FILE_NAME`: e.g. `file:./data/db.sqlite` (shared with drizzle config and runtime)
- `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`: defined per Better Auth requirements

You can surface them from Coolify or any secrets manager. Locally, load them via `.env` or `dotenv` before running `npm` scripts.

## Docker & Compose

1. Build and run the containerized stack:

   ```bash
   docker compose up --build
   ```

2. The multi-stage `Dockerfile` now seeds `/app/data/db.sqlite` by running `npx drizzle-kit migrate` whenever the file is missing and copies `/app/data` into the runner stage.
3. `docker-compose.yml` binds the `gigfin-data` volume to `/app/data`, ensuring the SQLite database persists across restarts.
4. Provide runtime environment variables through Coolify (preferred) or your `.env` file before running the stack.

Bring it down with `docker compose down` when you need to rebuild.

## Deployment guidance

- When deploying with Coolify or another orchestrator, point the server to the build output (`npm run build` + `npm start` or `next start`) and mount a persistent volume to `/app/data`.
- Set `NODE_ENV=production`, `BETTER_AUTH_*` secrets, and `DB_FILE_NAME` via the hosting provider; the image already defaults to `file:./data/db.sqlite`.

## Migrations & schema updates

- Manage schema changes with `npx drizzle-kit migrate` (adds new SQL migrations into `drizzle/`).
- Run migrations in CI or during image build so `db.sqlite` always reflects the latest schema before the server boots.

## License

This project is MIT licensed. See [LICENSE](LICENSE) for the full text.
