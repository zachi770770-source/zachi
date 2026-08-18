#!/usr/bin/env bash
# setup-benchmark (macOS/Linux)
# Creates an isolated venv, installs deps, and downloads the two approved
# multilingual models to ./models/. Sends NO manuscript content anywhere.
set -euo pipefail
cd "$(dirname "$0")"

export HF_HUB_DISABLE_TELEMETRY=1        # no telemetry during download
export PYTHONDONTWRITEBYTECODE=1

PY="${PYTHON:-python3}"
echo "==> creating virtual environment (.venv)"
"$PY" -m venv .venv
# shellcheck disable=SC1091
. .venv/bin/activate
python -m pip install --upgrade pip >/dev/null
echo "==> installing dependencies"
python -m pip install -r requirements.txt

echo "==> downloading approved models to ./models (weights only; nothing uploaded)"
python - <<'PY'
import os
os.environ["HF_HUB_DISABLE_TELEMETRY"] = "1"
from huggingface_hub import snapshot_download
for repo, out in [
    ("intfloat/multilingual-e5-small", "models/multilingual-e5-small"),
    ("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
     "models/paraphrase-multilingual-MiniLM-L12-v2"),
]:
    print(f"  - {repo}")
    snapshot_download(repo_id=repo, local_dir=out,
                      allow_patterns=["*.json","*.txt","*.model","*.bin","*.safetensors","*.py",
                                      "sentencepiece*","tokenizer*","vocab*","*.onnx"])
print("models ready under ./models/")
PY

echo
echo "Setup complete. Next: ./run-benchmark.sh   (set COMPASS_SOURCE first — see README)"
