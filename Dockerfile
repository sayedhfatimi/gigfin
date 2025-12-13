FROM node:20-alpine AS builder
WORKDIR /app
ENV DB_FILE_NAME=file:./data/db.sqlite

# Upgrade npm so builds inside this repo always use the latest CLI.
RUN npm install -g npm@latest

# Install dependencies before copying the rest of the project to leverage layer caching.
COPY package*.json ./
RUN npm ci

# Copy the remaining source files and build the Next.js app.
COPY . .
RUN mkdir -p data
RUN chmod +x docker-entrypoint.sh
RUN npm run build
RUN npm prune --production

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV DB_FILE_NAME=file:./data/db.sqlite

# Copy the production-ready assets from the builder stage.
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/data ./data
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/db ./db
COPY --from=builder /app/drizzle ./drizzle

# Ensure the non-root user owns the application files for security.
RUN chown -R node:node /app

ENTRYPOINT ["./docker-entrypoint.sh"]

USER node
EXPOSE 3000
CMD ["npm", "start"]
