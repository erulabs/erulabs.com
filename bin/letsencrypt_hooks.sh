#!/bin/bash -e
source ./bin/_variables.sh

if [ "$1" == "hook" ]; then
  mkdir -p ${LOCAL_ACME_DIR}
  echo "${CERTBOT_VALIDATION}" > "${LOCAL_ACME_DIR}/${CERTBOT_TOKEN}"
  gsutil -q -m cp ${LOCAL_ACME_DIR}/* gs://${PROJECT_BUCKET}/${REMOTE_ACME_DIR}/
fi
