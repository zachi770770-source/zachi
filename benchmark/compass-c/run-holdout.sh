#!/usr/bin/env bash
# run-holdout (macOS/Linux): runs the FROZEN winner once on the 75-question
# holdout. Refuses to run without winner.frozen.json. No parameter overrides.
set -euo pipefail
cd "$(dirname "$0")"
# shellcheck disable=SC1091
. ./_lib.sh

if [ ! -f winner.frozen.json ]; then
  echo "ERROR: winner.frozen.json not found. Run ./run-benchmark.sh first; a config must pass all gates."
  exit 1
fi

activate_venv
offline_env
resolve_source
start_pg

# pick the model dir that matches the frozen model_id (no override allowed)
MODEL_ID="$(python -c "import json;print(json.load(open('winner.frozen.json'))['model_id'])")"
case "$MODEL_ID" in
  "$MODEL_E5_ID")   MDIR="$MODEL_E5_DIR" ;;
  "$MODEL_MINI_ID") MDIR="$MODEL_MINI_DIR" ;;
  *) echo "ERROR: frozen model_id '$MODEL_ID' has no local model directory mapping."; exit 1 ;;
esac

echo "==> running frozen winner ($MODEL_ID) on the 75-question holdout, once"
python run_benchmark.py run-holdout --source "$SRC" --pg "$PG" --model-path "$MDIR"
echo
echo "Holdout complete -> holdout_report.json. Do not tune after seeing these results."
