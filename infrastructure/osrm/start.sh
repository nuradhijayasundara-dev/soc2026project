#!/bin/sh
set -e

DATA_DIR=/data
PBF="$DATA_DIR/sri-lanka-latest.osm.pbf"
OSRM="$DATA_DIR/sri-lanka-latest.osrm"
URL="${OSRM_DOWNLOAD_URL:-https://download.geofabrik.de/asia/sri-lanka-latest.osm.pbf}"

mkdir -p "$DATA_DIR"

if [ ! -f "$OSRM" ]; then
  echo "==> OSRM: no routing data found, preparing Sri Lanka extract"

  if [ ! -f "$PBF" ]; then
    echo "==> OSRM: downloading $URL"
    if command -v curl >/dev/null 2>&1; then
      DOWNLOAD="curl -fsSL --retry 5 --retry-delay 5 --connect-timeout 30 -o $PBF"
    elif command -v wget >/dev/null 2>&1; then
      DOWNLOAD="wget -q -O $PBF --timeout=30 --tries=5"
    else
      echo "OSRM: no pbf found and no curl/wget. Routing will fall back to distance estimates."; exit 2;
    fi
    $DOWNLOAD "$URL" \
      || { echo "OSRM: download failed (network). Routing will fall back to distance estimates."; exit 2; }
    echo "==> OSRM: downloaded $(du -h "$PBF" | cut -f1)"
  fi

  echo "==> OSRM: osrm-extract (car profile)"
  osrm-extract -p /opt/car.lua "$PBF"

  echo "==> OSRM: osrm-partition"
  osrm-partition "$OSRM"

  echo "==> OSRM: osrm-customize"
  osrm-customize "$OSRM"

  echo "==> OSRM: routing data ready"
fi

echo "==> OSRM: starting HTTP server on :5000"
exec osrm-routed --algorithm mld "$OSRM"