# API image. Build from the repository root:
#   docker build -f apps/api/Dockerfile -t mobilesocial-api apps/api
# Skip the ~88 MB image-moderation model (then mount it at /app/models, or run without blurring):
#   docker build -f apps/api/Dockerfile --build-arg SKIP_MODEL=1 -t mobilesocial-api apps/api
# Migration image (one-shot `prisma migrate deploy`, run before each new API version):
#   docker build -f apps/api/Dockerfile --target migrate -t mobilesocial-api-migrate apps/api
# Full guide: docs/deploy.md

# Debian (glibc), not Alpine: onnxruntime-node ships no musl binaries.
FROM node:24-bookworm-slim AS base
WORKDIR /app
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    PNPM_HOME=/pnpm
# Prisma's schema engine (migrate stage) needs OpenSSL and system CAs for TLS to the database.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && corepack enable

# Model in its own stage so code changes do not re-download it.
FROM base AS model
ARG SKIP_MODEL=0
COPY scripts/download-moderation-model.cjs scripts/
RUN mkdir -p models && if [ "$SKIP_MODEL" != "1" ]; then node scripts/download-moderation-model.cjs; fi

FROM base AS prod-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# onnxruntime-node ships macOS and Windows binaries too (~220 MB); only Linux runs here.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --prod \
 && rm -rf node_modules/.pnpm/onnxruntime-node@*/node_modules/onnxruntime-node/bin/napi-v*/darwin \
           node_modules/.pnpm/onnxruntime-node@*/node_modules/onnxruntime-node/bin/napi-v*/win32

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile
COPY . .
# prisma.config.ts reads DIRECT_URL; generate never connects, so a placeholder is enough.
RUN DIRECT_URL=postgresql://build:build@localhost:5432/build pnpm exec prisma generate \
 && pnpm exec nest build

# One-shot job: applies prisma/migrations to DIRECT_URL, then exits.
FROM build AS migrate
# Fetch the schema engine now so the job needs no download at run time.
RUN DIRECT_URL=postgresql://build:build@localhost:5432/build pnpm exec prisma version
USER node
CMD ["./node_modules/.bin/prisma", "migrate", "deploy"]

FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=model --chown=node:node /app/models ./models
COPY --chown=node:node package.json ./
COPY --chown=node:node scripts/make-admin.cjs scripts/download-moderation-model.cjs ./scripts/
USER node
EXPOSE 3000
# /api/admin is a static page: answers without touching the database.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/admin').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"
CMD ["node", "dist/src/main.js"]
