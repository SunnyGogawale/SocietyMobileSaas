#!/bin/sh
set -eu

: "${MONGODB_URI:?MONGODB_URI is required}"
backup_dir=${BACKUP_DIR:-./backups}
timestamp=$(date -u +%Y%m%dT%H%M%SZ)
mkdir -p "$backup_dir"
mongodump --uri "$MONGODB_URI" --archive="$backup_dir/society-$timestamp.archive.gz" --gzip