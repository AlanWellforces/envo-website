FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ─────────────────────────────────────────────
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
# Dummy values so payload.config.ts loads without error at build time
ARG DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
ENV DATABASE_URL=${DATABASE_URL}
ARG PAYLOAD_SECRET=build-time-placeholder
ENV PAYLOAD_SECRET=${PAYLOAD_SECRET}
# NEXT_PUBLIC_* are inlined at build time — must be present here or sitemap/OG
# absolute URLs fall back to http://localhost:3000.
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}

RUN npm run build

# ─────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

RUN apk add --no-cache libc6-compat
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next        ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/public       ./public

# Media uploads — volume mounted at runtime, pre-create so ownership is right
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/standalone/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./.next/standalone/public

RUN mkdir -p /app/media && chown nextjs:nodejs /app/media

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["npm", "start"]
