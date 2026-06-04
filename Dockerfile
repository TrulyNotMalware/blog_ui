# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS deps
WORKDIR /app
RUN npm install -g pnpm@10
# pnpm-workspace.yaml holds the build-script approval config (pnpm 10 reads it there, not from
# package.json): msw is allowed to build, sharp/unrs-resolver are skipped. It MUST be copied here
# or the frozen install dies with ERR_PNPM_IGNORED_BUILDS. pnpm is pinned (npm i -g pnpm@10) so
# corepack's "latest" can't drift the version out from under this config.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile


FROM node:22-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@10
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* vars are baked in at build time — pass via --build-arg
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NODE_ENV=production

RUN pnpm build


FROM node:22-alpine AS runtime

RUN addgroup -S app && adduser -S -G app -u 10001 app

WORKDIR /app
ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000

COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
COPY --from=builder --chown=app:app /app/public ./public

USER app
EXPOSE 3000
CMD ["node", "server.js"]
