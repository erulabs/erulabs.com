#!/bin/bash -e
source ./bin/_variables.sh

echo "Uploading to ${DEST} ..."

rsync -arc --delete --delete-after ./inf ./_build ${DEST}/

ssh ${SERVER} "\
  sudo /bin/cp /home/circleci/seandonmooy.com/inf/nginx/seandonmooy.conf /etc/nginx/sites-enabled/seandonmooy.conf && \
  sudo /usr/sbin/service nginx reload
"

echo "Done!"
