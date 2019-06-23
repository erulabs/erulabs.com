#!/bin/bash -e
source ./bin/_variables.sh

COMMAND="rsync -arv"
if ! [ -x "$(command -v rsync)" ]; then
  echo "Falling back to scp"
  COMMAND="scp -r "
fi

if [ "$1" == "hook" ]; then
  mkdir -p ${LOCAL_ACME_DIR}
  echo "${CERTBOT_VALIDATION}" > "${LOCAL_ACME_DIR}/${CERTBOT_TOKEN}"
  echo "CERTBOT_VALIDATION IS: ${CERTBOT_VALIDATION}"
  rsync -arvc ./_build ${DEST}/
fi
