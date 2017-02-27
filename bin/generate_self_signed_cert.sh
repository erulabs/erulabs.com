#!/bin/bash -e
source ./bin/_variables.sh

SECRETSDIR="secrets"

mkdir -p ${SECRETSDIR}

openssl genrsa -des3 -passout pass:x -out ${SECRETSDIR}/${PROJECT}_selfsigned.pass.key 2048
openssl rsa -passin pass:x -in ${SECRETSDIR}/${PROJECT}_selfsigned.pass.key -out ${SECRETSDIR}/${PROJECT}_selfsigned.key
rm ${SECRETSDIR}/${PROJECT}_selfsigned.pass.key
openssl req -new -key ${SECRETSDIR}/${PROJECT}_selfsigned.key -out ${SECRETSDIR}/${PROJECT}_selfsigned.csr
openssl x509 -req -sha256 -days 365 -in ${SECRETSDIR}/${PROJECT}_selfsigned.csr -signkey ${SECRETSDIR}/${PROJECT}_selfsigned.key -out ${SECRETSDIR}/${PROJECT}_selfsigned.crt
