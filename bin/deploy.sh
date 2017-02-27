#!/bin/bash -e
source ./bin/_variables.sh

if ! [ -x "$(command -v gsutil)" ]; then
  error "Please install 'gsutil' - via the Google Cloud SDK"
fi

echo "Uploading to ${PROJECT_BUCKET} ..."
gsutil -m rsync -R -c -d ./${BUILD_DIRECTORY} gs://${PROJECT_BUCKET}/

echo "Done!"
