#!/bin/bash -e
source ./bin/_variables.sh

USAGE="./bin/dev.sh"
YARN_VERSION_SUPPORTED="0.20.3"

if ! [ -x "$(command -v yarn)" ]; then
  error "Please install 'yarn' - npm install -g yarn"
fi
if [ "$(yarn --version)" != "$YARN_VERSION_SUPPORTED" ]; then
  error "Sorry, we only support yarn v${YARN_VERSION_SUPPORTED} (see ./bin/dev.sh)"
fi
if ! [ -f "package.json" ]; then
  error "This script needs to be run from the root of the repository"
fi
if ! [ -f "secrets/${PROJECT}_selfsigned.key" ]; then
  echo "Development key/cert missing. Generating now..."
  ./bin/generate_self_signed_cert.sh
fi

export NODE_ENV=development
yarn --ignore-engines --no-progress --no-emoji
./node_modules/.bin/gulp

./node_modules/.bin/webpack-dev-server \
  --https true \
  --key ./secrets/${PROJECT}_selfsigned.key \
  --cert ./secrets/${PROJECT}_selfsigned.crt \
  --open \
  --port ${DEV_PORT} \
  --hot \
  --content-base _build/seandonmooy.com \
  --colors \
  --watch
