# setup-benchmark (Windows PowerShell)
# Creates an isolated venv, installs deps, downloads the two approved models to
# .\models. Sends NO manuscript content anywhere.
$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot
$env:HF_HUB_DISABLE_TELEMETRY = "1"

$py = if ($env:PYTHON) { $env:PYTHON } else { "python" }
Write-Host "==> creating virtual environment (.venv)"
& $py -m venv .venv
. .\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip | Out-Null
Write-Host "==> installing dependencies"
python -m pip install -r requirements.txt

Write-Host "==> downloading approved models to .\models (weights only; nothing uploaded)"
@'
import os
os.environ["HF_HUB_DISABLE_TELEMETRY"] = "1"
from huggingface_hub import snapshot_download
for repo, out in [
    ("intfloat/multilingual-e5-small", "models/multilingual-e5-small"),
    ("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
     "models/paraphrase-multilingual-MiniLM-L12-v2"),
]:
    print("  - " + repo)
    snapshot_download(repo_id=repo, local_dir=out,
                      allow_patterns=["*.json","*.txt","*.model","*.bin","*.safetensors","*.py",
                                      "sentencepiece*","tokenizer*","vocab*","*.onnx"])
print("models ready under ./models/")
'@ | python -

Write-Host ""
Write-Host "Setup complete. Next: .\run-benchmark.ps1  (set COMPASS_SOURCE first - see README)"
