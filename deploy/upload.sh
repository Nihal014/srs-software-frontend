#!/usr/bin/env bash
# Build the Angular app on your laptop and publish it to the server.
#   ./deploy/upload.sh deploy@SERVER_IP
# Run from the frontend folder in Git Bash (scp/ssh ship with Git for Windows).
set -euo pipefail
TARGET="${1:?usage: ./deploy/upload.sh user@server-ip}"
cd "$(dirname "$0")/.."

# Only install when node_modules is missing: `npm ci` wipes it, which would break a running `ng serve`.
[ -d node_modules ] || npm ci
npx ng build --configuration production

DIST=dist/srs-software-frontend/browser
[ -f "$DIST/index.html" ] || { echo "build output not found at $DIST"; exit 1; }

# Upload to a temp folder, then swap it in, so visitors never see a half-copied site.
STAMP=$(date +%Y%m%d%H%M%S)
ssh "$TARGET" "mkdir -p /var/www/releases/$STAMP"
scp -r "$DIST"/* "$TARGET:/var/www/releases/$STAMP/"
ssh "$TARGET" "ln -sfn /var/www/releases/$STAMP /var/www/rsrbakes && ls -dt /var/www/releases/* | tail -n +6 | xargs -r rm -rf"
echo "published release $STAMP"
