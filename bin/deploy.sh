#!/bin/bash -e
source ./bin/_variables.sh

echo "Uploading to ${DEST} ..."

rsync -arv --delete --delete-after ./inf ./_build ${DEST}/

ssh ${SERVER} "\
  sudo /bin/cp -v /home/circleci/seandonmooy.com/inf/nginx/seandonmooy.conf /etc/nginx/sites-enabled/seandonmooy.conf && \
  sudo /usr/sbin/service nginx reload
"

echo "Done!"
