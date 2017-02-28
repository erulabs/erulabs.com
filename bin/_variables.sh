#!/bin/bash -e

PROJECT="seandonmooycom"
PROJECT_DOMAIN="seandonmooy.com"
BUILD_DIRECTORY="_build"
DEV_PORT="3005"

DEFAULT_USERNAME="eru"

SERVER="${SSH_USER:-${DEFAULT_USERNAME}}@${PROJECT_DOMAIN}"
DEST="${SERVER}:~eru/${PROJECT_DOMAIN}"

# For letsEncrypt
REMOTE_ACME_DIR=".well-known/acme-challenge"
LOCAL_ACME_DIR="./${BUILD_DIRECTORY}/${REMOTE_ACME_DIR}"

function error {
  echo "$1"
  exit 1
}
