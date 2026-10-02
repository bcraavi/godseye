#!/usr/bin/env bash
set -euo pipefail
cloud_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$cloud_root"
exec npm start -- --host 0.0.0.0
