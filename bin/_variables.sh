#!/bin/bash -e

BUILD_DIRECTORY="build"
SERVER="erulabs.com"
DEST_DIR="/www/erulabscom"
DEST="${SERVER}:${DEST_DIR}"
REMOTE_ACME_DIR=".well-known/acme-challenge"
LOCAL_ACME_DIR="./build/${REMOTE_ACME_DIR}"
