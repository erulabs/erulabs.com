#!/usr/bin/env bash
set -e

SECRETSDIR="k8s/dev/secrets"
mkdir -p ${SECRETSDIR}

if [[ ! -f "${SECRETSDIR}/tls.crt" ]]; then
  if [[ ! -x "$(command -v mkcert)" ]]; then
    openssl genrsa \
      -des3 -passout pass:xxxx -out ${SECRETSDIR}/tls.pass.key 2048

    openssl rsa \
      -passin pass:xxxx -in ${SECRETSDIR}/tls.pass.key -out ${SECRETSDIR}/tls.key

    subjectAltName="DNS:api"
    dn="C=US \n ST=California \n L=Pasadena \n O=seandonmooy \n OU=foobar \n CN=seandonmooy.com"
    reqConfig="[req] \n prompt=no \n utf8=yes \n distinguished_name=dn_details \n req_extensions=san_details \n [dn_details] \n ${dn} \n [san_details] \n subjectAltName=${subjectAltName}"
    mkdir -p tmp
    echo -e ${reqConfig} > tmp/tls.csr
    openssl req \
      -new -key ${SECRETSDIR}/tls.key -out ${SECRETSDIR}/tls.csr \
      -config tmp/tls.csr

    openssl x509 \
      -req -sha256 -days 365 -in ${SECRETSDIR}/tls.csr -signkey ${SECRETSDIR}/tls.key -out ${SECRETSDIR}/tls.crt

    rm ${SECRETSDIR}/tls.pass.key
  else
    mkcert -install
    mkcert -cert-file ${SECRETSDIR}/tls.crt -key-file ${SECRETSDIR}/tls.key localhost api
  fi
fi
