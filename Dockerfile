# syntax=docker/dockerfile:1

FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM oven/bun:1 AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build-time placeholders only — pages render dynamically and the server reads
# the real CONVEX_URL / CONVEX_SITE_URL from env at runtime (these just satisfy
# module init during `next build`).
ENV NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210
ENV NEXT_PUBLIC_CONVEX_SITE_URL=http://127.0.0.1:3211
RUN bun run build

FROM oven/bun:1 AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
# Full app (incl. convex/ source + CLI) so the entrypoint can deploy functions
# to the self-hosted backend.
COPY --from=build /app ./
RUN chmod +x docker-entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
