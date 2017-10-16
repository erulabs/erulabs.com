#!/bin/bash -e
source ./bin/_variables.sh

CDN_URI="https://${PROJECT_DOMAIN}" ./bin/build.sh

echo "Uploading to ${DEST} ..."

ssh ${SERVER} "mkdir -p ${DEST_DIR}"

rsync -arc --delete --delete-after ./inf ./_build ${DEST}/ | fgrep "nginx" > /dev/null && {
  echo "Reloading nginx"
  ssh ${SERVER} "\
    ! command -v nginx && apt-get install -yqq nginx && \
    sudo /bin/cp /home/circleci/erulabs.com/inf/nginx/seandonmooy.conf /etc/nginx/sites-enabled/seandonmooy.conf && \
    sudo /usr/sbin/service nginx reload
  "
}

echo "Done!"
