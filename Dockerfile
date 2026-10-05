# syntax=docker/dockerfile:1
# Runtime-only image. `yarn install` and `yarn build` run on the CI runner BEFORE
# `docker build`, so neither happens again inside Docker. `output: "standalone"` in
# next.config.ts bundles a minimal node_modules into .next/standalone, so no install
# is needed here at all.
#
# Building locally:  yarn install --frozen-lockfile && yarn build && docker build -t sme/corporate-bank-web-portal .
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --chown=nextjs:nodejs public ./public
COPY --chown=nextjs:nodejs .next/standalone ./
COPY --chown=nextjs:nodejs .next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
