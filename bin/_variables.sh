#!/bin/bash -e

PROJECT="seandonmooycom"
PROJECT_DOMAIN="seandonmooy.com"
PROJECT_BUCKET="seandonmooy.com"
BUILD_DIRECTORY="_build"
DEV_PORT="3005"

# For letsEncrypt
REMOTE_ACME_DIR=".well-known/acme-challenge"
LOCAL_ACME_DIR="./src/${REMOTE_ACME_DIR}"

function error {
  echo "$1"
  exit 1
}
