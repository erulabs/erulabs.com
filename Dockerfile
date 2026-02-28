# syntax=docker/dockerfile:1

FROM node:24-bullseye-slim AS node-version
ARG CACHEBUST

FROM node-version AS deps
WORKDIR /app
ENV YARN_CACHE_FOLDER=/home/node/.cache
COPY ./.yarn/releases/*.cjs /app/.yarn/releases/
COPY package.json yarn.lock .yarnrc.yml .npmr[c] ./
RUN --mount=type=cache,mode=0777,target=/home/node/.cache,uid=1000 \
  corepack enable && \
  corepack prepare && \
  yarn --immutable && \
  yarn next telemetry disable


FROM node-version AS builder
WORKDIR /app

ARG NODE_ENV=production
ARG NEXT_PUBLIC_APP_BUILD_ID
ARG NEXT_PUBLIC_APP_ENV
ARG NEXT_PUBLIC_API_TARGET
ARG NEXT_PUBLIC_WSS_TARGET
ARG NEXT_PUBLIC_USE_RELATIVE_API_TARGET
ARG NEXT_PUBLIC_STATIC_ASSET_PATH

ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    NODE_ENV=$NODE_ENV \
    NEXT_PUBLIC_APP_BUILD_ID=$NEXT_PUBLIC_APP_BUILD_ID \
    NEXT_PUBLIC_APP_ENV=$NEXT_PUBLIC_APP_ENV \
    NEXT_PUBLIC_API_TARGET=$NEXT_PUBLIC_API_TARGET \
    NEXT_PUBLIC_WSS_TARGET=$NEXT_PUBLIC_WSS_TARGET \
    NEXT_PUBLIC_USE_RELATIVE_API_TARGET=$NEXT_PUBLIC_USE_RELATIVE_API_TARGET \
    NEXT_PUBLIC_STATIC_ASSET_PATH=$NEXT_PUBLIC_STATIC_ASSET_PATH

COPY --from=deps /app/node_modules ./node_modules
COPY --chown=node:node . .
RUN --mount=type=cache,mode=0777,target=/app/.next/cache,uid=1000 \
  echo "NEXT_PUBLIC_APP_ENV: $NEXT_PUBLIC_APP_ENV" && \
  echo "NEXT_PUBLIC_API_TARGET: $NEXT_PUBLIC_API_TARGET" && \
  echo "NEXT_PUBLIC_API_TARGET exists:  $(if [ -n "$NEXT_PUBLIC_API_TARGET" ]; then echo "yes"; else echo "no"; fi)" && \
  echo "NEXT_PUBLIC_WSS_TARGET: $NEXT_PUBLIC_WSS_TARGET" && \
  echo "NEXT_PUBLIC_USE_RELATIVE_API_TARGET: $NEXT_PUBLIC_USE_RELATIVE_API_TARGET" && \
  echo "NEXT_PUBLIC_APP_BUILD_ID: $NEXT_PUBLIC_APP_BUILD_ID" && \
  echo "NEXT_PUBLIC_STATIC_ASSET_PATH: $NEXT_PUBLIC_STATIC_ASSET_PATH" && \
  corepack enable && \
  corepack prepare && \
  yarn build && \
  echo "VERSION: $NEXT_PUBLIC_APP_BUILD_ID" > /app/.next/static/version.txt


FROM deps AS dev
ENV NODE_ENV=development \
    NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000
COPY --chown=node:node . .
ENTRYPOINT [ "yarn", "dev" ]


FROM builder AS runner
WORKDIR /app
ENV NODE_ENV=production
USER node
EXPOSE 3000
CMD ["yarn", "start"]
