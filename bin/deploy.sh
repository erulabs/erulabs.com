#!/bin/bash -e
source ./bin/_variables.sh

CDN_URI="https://${PROJECT_DOMAIN}" ./bin/build.sh

echo "Uploading to ${DEST} ..."

rsync -arc --delete --delete-after ./inf ./_build ${DEST}/ | fgrep "nginx" > /dev/null && {
  echo "Reloading nginx"
  ssh ${SERVER} "\
    ! command -v nginx && apt-get install -yqq nginx && \
    sudo rm /etc/nginx/sites-enabled/default && \
    sudo /bin/cp -v /www/erulabs.com/inf/nginx/erulabs.conf /etc/nginx/sites-enabled/erulabs.conf && \
    sudo /usr/sbin/service nginx reload
  "
}

echo "Done!"
