# run-holdout (Windows PowerShell): runs the FROZEN winner once on the
# 75-question holdout. Refuses to run without winner.frozen.json. No overrides.
$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot
. .\_lib.ps1

if (-not (Test-Path winner.frozen.json)) {
  Write-Error "winner.frozen.json not found. Run .\run-benchmark.ps1 first; a config must pass all gates."
  exit 1
}
try {
  Enable-Venv; Set-OfflineEnv; Resolve-Source; Start-Pg

  $modelId = (Get-Content winner.frozen.json -Raw | ConvertFrom-Json).model_id
  switch ($modelId) {
    $script:ModelE5Id   { $mdir = $script:ModelE5Dir }
    $script:ModelMiniId { $mdir = $script:ModelMiniDir }
    default { Write-Error "frozen model_id '$modelId' has no local model directory mapping."; exit 1 }
  }

  Write-Host "==> running frozen winner ($modelId) on the 75-question holdout, once"
  python run_benchmark.py run-holdout --source "$script:SRC" --pg "$script:PG" --model-path "$mdir"
  Write-Host ""
  Write-Host "Holdout complete -> holdout_report.json. Do not tune after seeing these results."
} finally { Stop-Pg }
