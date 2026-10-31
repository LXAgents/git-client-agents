#!/bin/sh
# Runs from /docker-entrypoint.d before nginx starts: writes the runtime settings the app reads.
set -e

target=/usr/share/nginx/html/config.js
if [ -n "$API_URL" ]; then
  # Escape backslashes and double quotes so any URL stays a valid JavaScript string.
  escaped=$(printf '%s' "$API_URL" | sed 's/\\/\\\\/g; s/"/\\"/g')
  printf 'window.__APP_CONFIG__ = { apiUrl: "%s" }\n' "$escaped" > "$target"
  echo "app-config: API_URL=$API_URL"
else
  printf 'window.__APP_CONFIG__ = {}\n' > "$target"
  echo "app-config: API_URL not set, using the build-time VITE_API_URL"
fi
