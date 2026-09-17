#!/usr/bin/env bash
set -euo pipefail
project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
: "${DATA_PLUGIN_ROOT:?Set DATA_PLUGIN_ROOT to the installed data-analytics plugin directory}"
env -u CODEX_SESSION_ID -u CODEX_THREAD_ID node "$DATA_PLUGIN_ROOT/scripts/data-app.mjs" build --project-dir "$project_root/app" --source > "$project_root/app/.source-build.json"
python3 "$project_root/scripts/package_site.py"
