#!/bin/bash -e
source ./bin/_variables.sh

echo "Uploading to ${DEST} ..."

COMMAND="rsync -arv"
if ! [ -x "$(command -v rsync)" ]; then
  echo "Falling back to scp"
  COMMAND="scp -r "
fi

${COMMAND} ./_build ${DEST}/
${COMMAND} ./inf ${DEST}/
${COMMAND} ./secrets ${DEST}/

ssh ${SERVER} "\
  sudo rsync -av --delete ~/${PROJECT_DOMAIN}/inf/nginx/* /etc/nginx/sites-enabled/ && \
  sudo service nginx reload
"

echo "Done!"
