#!/bin/bash -e
source ./bin/_variables.sh

echo "Uploading to ${PROJECT_BUCKET} ..."

if ! [ -x "$(command -v gsutil)" ]; then
  ~/AppData/Local/Google/Cloud\ SDK/google-cloud-sdk/platform/gsutil/gsutil -m rsync -R -c -d ./${BUILD_DIRECTORY} gs://${PROJECT_BUCKET}/
else
  gsutil -m rsync -R -c -d ./${BUILD_DIRECTORY} gs://${PROJECT_BUCKET}/
fi



echo "Done!"
