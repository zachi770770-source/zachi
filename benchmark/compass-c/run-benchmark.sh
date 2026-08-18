#!/usr/bin/env bash
# run-benchmark (macOS/Linux): tune on the 56-set only; freeze a winner if all
# gates pass. Never touches the holdout. Set COMPASS_SOURCE (.docx or .json).
set -euo pipefail
cd "$(dirname "$0")"
# shellcheck disable=SC1091
. ./_lib.sh

activate_venv
offline_env
resolve_source
start_pg

echo "==> selfcheck (chunk count, block accuracy, holdout hash)"
python run_benchmark.py selfcheck --source "$SRC"

echo "==> tuning model A: $MODEL_E5_ID"
python run_benchmark.py tune --source "$SRC" --pg "$PG" \
  --model-path "$MODEL_E5_DIR" --model-id "$MODEL_E5_ID"

echo "==> tuning model B: $MODEL_MINI_ID"
python run_benchmark.py tune --source "$SRC" --pg "$PG" \
  --model-path "$MODEL_MINI_DIR" --model-id "$MODEL_MINI_ID"

echo
if [ -f winner.frozen.json ]; then
  echo "A configuration PASSED all gates -> winner.frozen.json written."
  echo "Next (only now): ./run-holdout.sh"
else
  echo "No configuration cleared all gates on the 56-set. Nothing frozen; holdout must NOT be run."
fi
