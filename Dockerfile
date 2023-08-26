# syntax=docker/dockerfile:1.3

FROM node:20-bullseye-slim AS base-version

FROM base-version AS build-deps
# RUN apt-get update -yqq && apt-get install -yqq build-essential python3 make g++ dpkg curl bash git

# Install dependencies only when needed
FROM build-deps AS dev-deps
WORKDIR /app
COPY package.json yarn.lock .npmr[c] ./
ENV NODE_ENV=development
RUN yarn install --frozen-lockfile

FROM build-deps AS prod-deps
WORKDIR /app
COPY package.json yarn.lock .npmr[c] ./
ENV NODE_ENV=production
RUN yarn install --frozen-lockfile

# Install dependencies only when needed
FROM base-version AS base
WORKDIR /app
RUN apt-get update -yqq && \
  apt-get install -yqq bash curl && \
  mkdir -p /app/secrets && \
  chown -R node:node /app

FROM base AS dev
USER node
ENV NEXT_TELEMETRY_DISABLED="1" \
  NODE_ENV=development \
  HOST="0.0.0.0" \
  HTTPS=true \
  TZ=UTC
COPY --chown=node:node --from=dev-deps /app/node_modules ./node_modules
COPY --chown=node:node public ./public
COPY --chown=node:node pages ./pages
COPY --chown=node:node components ./components
COPY --chown=node:node .env.loca[l] *r[c] *.j[s] *.jso[n] *.yam[l] *.m[d] *.loc[k] ./
RUN NODE_ENV=development ./node_modules/.bin/next build
COPY --chown=node:node scripts ./scripts
CMD ["yarn", "dev"]

FROM base as production-build
WORKDIR /app
ENV NODE_ENV=production \
  NEXT_TELEMETRY_DISABLED="1"
COPY --chown=node:node --from=dev-deps /app/node_modules ./node_modules
COPY --chown=node:node .env.loca[l] *rc *.js *.json *.yaml *.md *.lock ./
COPY --chown=node:node public ./public
COPY --chown=node:node pages ./pages
COPY --chown=node:node components ./components
RUN NODE_ENV=production ./node_modules/.bin/next build

FROM base AS production
WORKDIR /app
USER node
ENV NODE_ENV=production \
  NEXT_TELEMETRY_DISABLED="1" \
  HOST="0.0.0.0" \
	PORT=3003 \
  TZ=UTC
COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules
COPY --chown=node:node .env.loca[l] *rc *.js *.json *.yaml *.md *.lock ./
COPY --chown=node:node next.config.js ./
COPY --chown=node:node public ./public
COPY --chown=node:node scripts ./scripts
COPY --chown=node:node pages ./pages
COPY --chown=node:node components ./components
COPY --from=production-build --chown=node:node /app/.next/standalone ./
COPY --from=production-build --chown=node:node /app/.next/static ./.next/static
EXPOSE 3003
VOLUME ["/app/secrets"]
CMD ["yarn", "start"]
