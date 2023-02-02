
VERSION=$(git rev-parse HEAD)

ssh eru@seandonmooy.com << EOF
  set -e
  sudo n lts
  pushd erulabs.com
  git pull origin ${VERSION}
  yarn
  yarn build
  sudo service erulabs restart
EOF
