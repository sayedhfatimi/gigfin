<p align="center">
  <img
    src="https://raw.githubusercontent.com/sayedhfatimi/gigfin/main/public/logo.png"
    alt="GigFin logo"
    width="120"
  />
</p>

# GigFin

GigFin helps gig workers keep a simple, reliable ledger of their overall income across platforms alongside monthly trends and platform breakdowns. Because the app focuses on platform-level income totals, it currently does not track individual line items per platform. It combines a responsive Next.js dashboard with Better Auth–powered credential login, 2FA, and a fast SQLite + Drizzle ORM backend so you can log earnings securely from any device.

A hosted instance is available at https://gigfin.me, but GigFin is designed for self-hosting, and deploying your own instance is the recommended way to keep your data private and under your control.

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

## Environment variables

GigFin expects:

- `BETTER_AUTH_SECRET`: required; generate one with `npx @better-auth/cli@latest secret` or run the command `openssl rand -base64 32` in a terminal.
- `BETTER_AUTH_URL`: required; the public URL where your GigFin instance is accessible (e.g., `https://gigfin.me` or your own domain).
- `DB_FILE_NAME`: optional; falls back to `file:./data/db.sqlite` and is shared with the Drizzle config and runtime.
- `INTERNAL_API_BASE`: optional; defaults to `http://localhost:3000` and points GigFin at the internal API host.

You can surface them from Coolify or any secrets manager. Locally, load them via `.env` or `dotenv` before running `npm` scripts.

## Deployment guidance

### Docker & Compose

1. Build and run the containerized stack:

   ```bash
   docker compose up --build
   ```

2. The multi-stage `Dockerfile` now seeds `/app/data/db.sqlite` by running `npx drizzle-kit migrate` whenever the file is missing and copies `/app/data` into the runner stage.
3. `docker-compose.yml` binds the `gigfin-data` volume to `/app/data`, ensuring the SQLite database persists across restarts.
4. Docker Compose reads runtime environment variables from `.env` (see the `env_file` section in `docker-compose.yml`); keep your secrets there or load them through your orchestration platform.

Bring it down with `docker compose down` when you need to rebuild.

### Coolify

- Fork the repo and add it as a new service in Coolify, picking the **private repository** option if you want automatic builds on updates.
- In Coolify select the **docker-compose** deployment option, provide the required environment variables, and deploy—no extra build configuration is needed once the stack starts.

## Getting started (local development)

This section explains how to set up a local development environment for hacking on GigFin or contributing changes. If you only need to run a production instance, skip ahead to **Docker & Compose** or **Deployment guidance**.

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

## License

This project is MIT licensed. See [LICENSE](LICENSE) for the full text.
