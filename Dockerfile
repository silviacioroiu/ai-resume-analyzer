# ---- Base: Node + pnpm ------------------------------------------------------
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# ---- Build: install all deps and build client + server ----------------------
FROM base AS builder
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# ---- Runtime: production deps only ------------------------------------------
FROM base AS runner
ENV NODE_ENV=production
RUN pnpm install --prod --frozen-lockfile && pnpm store prune
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh && chown -R node:node /app
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD wget -qO- http://localhost:3000/api/health || exit 1
CMD ["./entrypoint.sh"]
