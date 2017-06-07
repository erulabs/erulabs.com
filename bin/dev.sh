#!/bin/bash -e
source ./bin/_variables.sh

USAGE="./bin/dev.sh"

if ! [ -x "$(command -v yarn)" ]; then
  error "Please install 'yarn' - npm install -g yarn"
fi
if ! [ -f "package.json" ]; then
  error "This script needs to be run from the root of the repository"
fi
if ! [ -f "secrets/${PROJECT}_selfsigned.key" ]; then
  echo "Development key/cert missing. Generating now..."
  ./bin/generate_self_signed_cert.sh
fi

export NODE_ENV=development
./bin/build.sh

DEV_PORT=${DEV_PORT} ./node_modules/.bin/webpack-dev-server \
  --https true \
  --key ./secrets/${PROJECT}_selfsigned.key \
  --cert ./secrets/${PROJECT}_selfsigned.crt \
  --open \
  --port ${DEV_PORT} \
  --hot \
  --content-base _build/ \
  --colors \
  --watch
