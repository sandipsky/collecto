#!/usr/bin/env bash
# Build the app and deploy it to nginx, setting up the nginx config on first run.
#
# Usage:
#   ./scripts/deploy.sh                 # build + deploy to defaults
#   DEPLOY_DIR=/var/www/app2 PORT=8081 CONF_NAME=app2.conf ./scripts/deploy.sh
#   SKIP_BUILD=1 ./scripts/deploy.sh    # deploy the existing dist/ without rebuilding
#
# Env overrides:
#   DEPLOY_DIR   target web root           (default: /var/www/collecto)
#   PORT         port nginx listens on     (default: 8080)
#   CONF_NAME    nginx site config name    (default: collecto.conf)
#   SERVER_NAME  nginx server_name         (default: _)
#   SKIP_BUILD   set to 1 to skip the build step
#   NO_RELOAD    set to 1 to skip the nginx test + reload
set -euo pipefail

# Resolve the project root regardless of where the script is invoked from.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

DEPLOY_DIR="${DEPLOY_DIR:-/var/www/collecto}"
PORT="${PORT:-8081}"
CONF_NAME="${CONF_NAME:-collecto.conf}"
SERVER_NAME="${SERVER_NAME:-_}"
DIST_DIR="$PROJECT_DIR/dist"

NGINX_CONF="/etc/nginx/nginx.conf"
CONF_DIR="/etc/nginx/conf.d"
SITE_CONF="$CONF_DIR/$CONF_NAME"

# nginx config and /var/www live outside the user's home, so use sudo for them.
SUDO=""
if [ "$(id -u)" -ne 0 ]; then
  SUDO="sudo"
fi

# --- 1. Build -----------------------------------------------------------------
if [ "${SKIP_BUILD:-0}" != "1" ]; then
  echo "==> Building (npm run build)"
  npm run build
else
  echo "==> Skipping build (SKIP_BUILD=1)"
fi

if [ ! -d "$DIST_DIR" ]; then
  echo "error: $DIST_DIR not found — run a build first" >&2
  exit 1
fi

# --- 2. Ensure nginx loads the conf.d drop-in directory -----------------------
$SUDO mkdir -p "$CONF_DIR"
if ! $SUDO grep -qE '^\s*include\s+conf\.d/\*\.conf;' "$NGINX_CONF"; then
  echo "==> Adding 'include conf.d/*.conf;' to $NGINX_CONF"
  $SUDO sed -i '/^http {/a\    include conf.d/*.conf;' "$NGINX_CONF"
fi

# --- 3. Write the site config (idempotent — kept in sync each deploy) ---------
echo "==> Writing $SITE_CONF"
$SUDO tee "$SITE_CONF" > /dev/null <<EOF
server {
    listen      $PORT;
    server_name $SERVER_NAME;

    root $DEPLOY_DIR;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # autoindex JSON so the gallery can discover images dropped at runtime
    location /images/ {
        autoindex on;
        autoindex_format json;
        add_header Cache-Control "no-store" always;
    }
}
EOF

# --- 4. Deploy the build ------------------------------------------------------
echo "==> Deploying to $DEPLOY_DIR"
$SUDO mkdir -p "$DEPLOY_DIR"

# Replace every top-level entry from the build EXCEPT images/. Removing each
# target first clears stale hashed bundles under assets/ (delete semantics)
# without touching the gallery's runtime-dropped files.
for entry in "$DIST_DIR"/*; do
  name="$(basename "$entry")"
  [ "$name" = "images" ] && continue
  $SUDO rm -rf "$DEPLOY_DIR/$name"
  $SUDO cp -r "$entry" "$DEPLOY_DIR/$name"
done

# Sync bundled demo images additively (overwrite, never delete) so files
# added on the server at runtime survive deploys.
if [ -d "$DIST_DIR/images" ]; then
  $SUDO mkdir -p "$DEPLOY_DIR/images"
  $SUDO cp -r "$DIST_DIR/images/." "$DEPLOY_DIR/images/"
fi

# Make sure nginx (user: http on Arch) can read everything.
if id -u http >/dev/null 2>&1; then
  $SUDO chown -R http:http "$DEPLOY_DIR"
fi

# --- 5. Test + reload ---------------------------------------------------------
if [ "${NO_RELOAD:-0}" != "1" ]; then
  echo "==> Testing nginx config and reloading"
  $SUDO nginx -t
  $SUDO systemctl reload nginx
else
  echo "==> Skipping nginx reload (NO_RELOAD=1)"
fi

echo "==> Done. $DEPLOY_DIR is live on http://localhost:$PORT"
