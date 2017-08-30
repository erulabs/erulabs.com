#!/bin/bash -e
source ./bin/_variables.sh

USAGE="./bin/dev.sh"

if ! [ -x "$(command -v yarn)" ]; then
  error "Please install 'yarn' - npm install -g yarn"
fi
if ! [ -f "package.json" ]; then
  error "This script needs to be run from the root of the repository"
fi

yarn

NODE_ENV=development ./node_modules/.bin/gulp watch
