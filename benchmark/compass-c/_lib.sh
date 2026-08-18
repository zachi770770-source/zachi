#!/usr/bin/env bash
# Shared helpers for run-benchmark.sh / run-holdout.sh (macOS/Linux).
set -euo pipefail

PG_CONTAINER="compass-bench-pg"
STARTED_PG=0

offline_env() {
  # Hard offline + no telemetry. No external embedding API is ever contacted.
  export TRANSFORMERS_OFFLINE=1 HF_HUB_OFFLINE=1 HF_HUB_DISABLE_TELEMETRY=1
  export TOKENIZERS_PARALLELISM=false PYTHONDONTWRITEBYTECODE=1
}

activate_venv() {
  if [ ! -d .venv ]; then echo "ERROR: run ./setup-benchmark.sh first."; exit 1; fi
  # shellcheck disable=SC1091
  . .venv/bin/activate
}

resolve_source() {
  : "${COMPASS_SOURCE:?set COMPASS_SOURCE to your canonical .docx or .source.json (stays local)}"
  mkdir -p .local
  case "$COMPASS_SOURCE" in
    *.docx)
      SRC=".local/medaytim-laahava-888-final.source.json"
      echo "==> converting DOCX -> source.json locally (never uploaded)"
      python convert.py --docx "$COMPASS_SOURCE" --out "$SRC" ;;
    *.json) SRC="$COMPASS_SOURCE" ;;
    *) echo "ERROR: COMPASS_SOURCE must end in .docx or .json"; exit 1 ;;
  esac
  export SRC
}

start_pg() {
  if [ -n "${COMPASS_PG:-}" ]; then export PG="$COMPASS_PG"; echo "==> using COMPASS_PG"; return; fi
  if command -v docker >/dev/null 2>&1; then
    echo "==> starting throwaway Postgres (Docker)"
    docker rm -f "$PG_CONTAINER" >/dev/null 2>&1 || true
    docker run -d --name "$PG_CONTAINER" -e POSTGRES_PASSWORD=bench -p 55432:5432 postgres:16 >/dev/null
    STARTED_PG=1
    export PG="postgresql://postgres:bench@127.0.0.1:55432/postgres"
    echo -n "   waiting for Postgres"
    for _ in $(seq 1 60); do
      if docker exec "$PG_CONTAINER" pg_isready -U postgres >/dev/null 2>&1; then echo " ready"; return; fi
      echo -n "."; sleep 1
    done
    echo; echo "ERROR: Postgres did not become ready"; exit 1
  fi
  echo "ERROR: no Postgres. Install Docker Desktop, or set COMPASS_PG to a Postgres DSN."; exit 1
}

stop_pg() {
  if [ "$STARTED_PG" = "1" ]; then docker rm -f "$PG_CONTAINER" >/dev/null 2>&1 || true; fi
}
trap stop_pg EXIT

MODEL_E5_ID="intfloat/multilingual-e5-small"
MODEL_E5_DIR="models/multilingual-e5-small"
MODEL_MINI_ID="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
MODEL_MINI_DIR="models/paraphrase-multilingual-MiniLM-L12-v2"
