#!/bin/bash -e
source ./bin/_variables.sh

# Generate .release file
AUTHOR=$(git log -1 | fgrep Author | sed 's/Author:\ //' | awk '{print $1}')
COMMIT_MSG=$(git log -1 | cat | tail -n +5 | sed "s/^    //" | tr '\n' ' ' | sed 's/[ \t]*$//')
COMMIT_HASH=$(git log -1 | head -n1 | awk '{print $2}')
COMMIT_SHORT=$(echo $COMMIT_HASH | cut -c1-7)
RELEASE_TEXT="$COMMIT_SHORT: $AUTHOR '$COMMIT_MSG'"
echo "Building tag \"${TAG}\": ${RELEASE_TEXT}"
echo "${RELEASE_TEXT}" > ./.release

yarn --ignore-engines --no-progress --no-emoji
rm -rf ./build

NODE_ENV=production ./node_modules/.bin/webpack --progress --colors
