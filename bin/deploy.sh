#!/bin/bash -e
source ./bin/_variables.sh

echo "Uploading to ${DEST} ..."

rsync -arv --delete --delete-after \
  --exclude="secrets/*selfsigned*" \
  --exclude="secrets/dhparams.pem" \
  ./secrets ./inf ./_build ${DEST}/

ssh ${SERVER} "\
  sudo /bin/cp -v /home/circleci/seandonmooy.com/inf/nginx/seandonmooy.conf /etc/nginx/sites-enabled/seandonmooy.conf && \
  sudo /usr/sbin/service nginx reload && \
  chown -v -R circleci:www-data seandonmooy.com/secrets seandonmooy.com/inf | fgrep -v retained && \
  chmod -v 644 seandonmooy.com/secrets/*
"

echo "Done!"
