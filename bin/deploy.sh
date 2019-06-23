#!/bin/bash -e
source ./bin/_variables.sh

yarn
yarn build

echo "Uploading to ${DEST} ..."

rsync -arcv ./secrets ${DEST}/

rsync -arcv --delete --delete-after ./inf ./_build ${DEST}/ | fgrep "nginx" > /dev/null && {
  echo "Reloading nginx"
  ssh ${SERVER} "\
    { ! -f ${DEST}/secrets/dhparams.pem && openssl dhparam -out ${DEST}/secrets/dhparams.pem 4096 } && \
    sudo rm -f /etc/nginx/sites-enabled/default && \
    sudo /bin/cp -v ${DEST}/inf/nginx/erulabs.conf /etc/nginx/sites-enabled/erulabscom.conf && \
    sudo /usr/sbin/service nginx reload"
}

echo "Done!"
