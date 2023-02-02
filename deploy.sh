
VERSION=$(git rev-parse HEAD)

echo "Deploying '${VERSION}'..."

ssh eru@seandonmooy.com << EOF
  set -e
	set -x
  sudo n lts
  pushd erulabs.com
  git pull origin ${VERSION}
  yarn
  yarn build
  sudo service erulabs restart
EOF
