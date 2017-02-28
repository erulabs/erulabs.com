#!/bin/bash -e

./node_modules/.bin/eslint src
./node_modules/.bin/flow check src
