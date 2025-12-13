FROM node:20-alpine AS builder
WORKDIR /app
ENV DB_FILE_NAME=file:./data/db.sqlite

# Install dependencies before copying the rest of the project to leverage layer caching.
COPY package*.json ./
RUN npm ci

# Copy the remaining source files and build the Next.js app.
COPY . .
RUN mkdir -p data \
  && npx drizzle-kit migrate
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

# Ensure the non-root user owns the application files for security.
RUN chown -R node:node /app

USER node
EXPOSE 3000
CMD ["npm", "start"]
