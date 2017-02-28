#!/bin/bash -e
source ./bin/_variables.sh

mkdir -p tmp/le
mkdir -p secrets

certbot -n \
  --config-dir tmp/le \
  --work-dir tmp/le \
  --logs-dir tmp/le \
  --manual \
  -d erulabs.com \
  -d seandonmooy.com \
  -d www.erulabs.com \
  -d www.seandonmooy.com \
  -m seandon.mooy@gmail.com \
  --agree-tos --manual-public-ip-logging-ok \
  --manual-auth-hook "./bin/letsencrypt_hooks.sh hook" \
  --manual-cleanup-hook "./bin/letsencrypt_hooks.sh cleanup" \
  certonly

echo -e "\nRemoving tmp files..."
rm -rfv ${LOCAL_ACME_DIR}

echo -e "\nCopying certs..."
cp -v tmp/le/live/seandonmooy.com/*.pem secrets/
