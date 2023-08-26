#!/bin/bash

set -ef -o pipefail

if [[ $NODE_ENV == "development" ]]; then
  INSPECTOR_PORT="${INSPECTOR_PORT:-9229}"

  echo -n "Waiting for mariadb to be ready"
  while ! nc -z mariadb 3306; do
    echo -n "."
    sleep 1
  done
  echo ""

  if [[ -n $SQL_SETUP ]]; then
    sleep 1
    yarn run knex migrate:latest
  else
    sleep 2
  fi

  echo -n "Starting "
  echo -n "$@"
  echo " in DEVELOPMENT mode"
  ./node_modules/.bin/nodemon "$@" \
    --watch "$@" \
    --watch lib \
    --watch common.js \
    --ext js,json,yaml,plain,md \
    --exec "node --trace-deprecation --trace-warnings --dns-result-order ipv4first"
    # --inspect="0.0.0.0:${INSPECTOR_PORT}" \
else
  node \
    --trace-deprecation \
    --trace-warnings \
    --dns-result-order ipv4first \
    "$@"
fi
