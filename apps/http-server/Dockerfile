
ARG BUN_VERSION=1.4.1

# Stage 1: Dependencies
FROM oven/bun:${BUN_VERSION} AS dependencies

WORKDIR /app

COPY package.json bun.lock ./

COPY apps/web/package.json ./apps/web/package.json
COPY apps/http-server/package.json ./apps/http-server/package.json
COPY apps/ws-server/package.json ./apps/ws-server/package.json

COPY packages/config/package.json ./packages/config/package.json
COPY packages/database/package.json ./packages/database/package.json
COPY packages/shared/package.json ./packages/shared/package.json

RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# Stage 2: Build server bundle
FROM dependencies AS builder

WORKDIR /app

COPY . .

RUN bun run --cwd apps/http-server build

# Stage 3: Production runtime
FROM oven/bun:${BUN_VERSION} AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HTTP_SERVER_HOST=0.0.0.0
ENV HTTP_SERVER_PORT=3001

COPY --from=builder --chown=bun:bun \
    /app/apps/http-server/dist ./

USER bun 

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-interval=10s --retries=3 \
    CMD ["bun", "-e", "const p=Bun.env.HTTP_SERVER_PORT||'3001';const r=await fetch('http://127.0.0.1:'+p+'/health');if(!r.ok)process.exit(1)"]

CMD ["bun", "index.js"]