
ARG BUN_VERSION=1.4.1

# Stage 1: Install monorepo dependencies
FROM oven/bun:${BUN_VERSION} AS dependencies

WORKDIR /app

# Package files pehle copy karne se dependency layer cache hoti hai
COPY package.json bun.lock ./

COPY apps/web/package.json ./apps/web/package.json
COPY apps/http-server/package.json ./apps/http-server/package.json
COPY apps/ws-server/package.json ./apps/ws-server/package.json

COPY packages/config/package.json ./packages/config/package.json
COPY packages/database/package.json ./packages/database/package.json
COPY packages/shared/package.json ./packages/shared/package.json

RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# Stage 2: Build Next.js
FROM dependencies AS builder

WORKDIR /app

COPY . .

# Ensure public exists, otherwise Docker COPY can fail later
RUN mkdir -p apps/web/public

# NEXT_PUBLIC variables browser JavaScript mein build-time par embed hoti hain
ARG NEXT_PUBLIC_HTTP_SERVER_URL=http://localhost:3001
ARG NEXT_PUBLIC_WS_SERVER_URL=ws://localhost:3002

ENV NEXT_PUBLIC_HTTP_SERVER_URL=${NEXT_PUBLIC_HTTP_SERVER_URL}
ENV NEXT_PUBLIC_WS_SERVER_URL=${NEXT_PUBLIC_WS_SERVER_URL}
ENV NEXT_TELEMETRY_DISABLED=1

RUN bun run --cwd apps/web build

# Stage 3: Minimal production image
FROM oven/bun:${BUN_VERSION} AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

RUN mkdir -p apps/web/.next && chown -R bun:bun apps

# outputFileTracingRoot ki wajah se standalone output monorepo structure rakhta hai
COPY --from=builder --chown=bun:bun \
    /app/apps/web/.next/standalone ./

COPY --from=builder --chown=bun:bun \
    /app/apps/web/.next/static ./apps/web/.next/static

COPY --from=builder --chown=bun:bun \
    /app/apps/web/public ./apps/web/public

USER bun

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD ["bun", "-e", "const r=await fetch('http://127.0.0.1:3000');if(!r.ok)process.exit(1)"]

CMD ["bun", "apps/web/server.js"]



