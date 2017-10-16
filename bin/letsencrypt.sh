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
  -d erulabs.com \
  -d www.erulabs.com \
  -d www.erulabs.com \
  -m seandon.mooy@gmail.com \
  --agree-tos --manual-public-ip-logging-ok \
  --manual-auth-hook "./bin/letsencrypt_hooks.sh hook" \
  --manual-cleanup-hook "./bin/letsencrypt_hooks.sh cleanup" \
  certonly && {

cp tmp/le/live/erulabs.com/*.pem secrets/

rsync -arvc ./secrets ${DEST}/

ssh ${SERVER} "sudo /usr/sbin/service nginx reload"

rm -rf src/.well-known
echo "Done!"

} || echo "No action taken"
