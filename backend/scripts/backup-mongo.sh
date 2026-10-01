#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${MONGO_URI:-}" ]]; then
  echo "Set MONGO_URI in your environment before running the backup." >&2
  exit 1
fi

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
backup_dir="${WOG_BACKUP_DIR:-${script_dir}/../../backups}"
mkdir -p "$backup_dir"
chmod 700 "$backup_dir"
backup_file="${backup_dir%/}/wog-$(date -u +%Y%m%dT%H%M%SZ).archive.gz"

if ! command -v mongodump >/dev/null 2>&1; then
  echo "mongodump is required. Install MongoDB Database Tools, then retry." >&2
  exit 1
fi

mongodump --uri="$MONGO_URI" --archive="$backup_file" --gzip
chmod 600 "$backup_file"
echo "Backup created: $backup_file"
