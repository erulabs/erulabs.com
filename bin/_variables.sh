#!/bin/bash -e

PROJECT="erulabscom"
PROJECT_DOMAIN="erulabs.com"
BUILD_DIRECTORY="_build"
DEV_PORT="3005"

DEFAULT_USERNAME="eru"

SERVER="${SSH_USER:-${DEFAULT_USERNAME}}@${PROJECT_DOMAIN}"
DEST_DIR="/www/${PROJECT_DOMAIN}"
DEST="${SERVER}:${DEST_DIR}"

# For letsEncrypt
REMOTE_ACME_DIR=".well-known/acme-challenge"
LOCAL_ACME_DIR="./${BUILD_DIRECTORY}/${REMOTE_ACME_DIR}"

function error {
  echo "$1"
  exit 1
}
