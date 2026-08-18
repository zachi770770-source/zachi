# run-benchmark (Windows PowerShell): tune on the 56-set only; freeze a winner
# if all gates pass. Never touches the holdout. Set COMPASS_SOURCE first.
$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot
. .\_lib.ps1
try {
  Enable-Venv; Set-OfflineEnv; Resolve-Source; Start-Pg

  Write-Host "==> selfcheck (chunk count, block accuracy, holdout hash)"
  python run_benchmark.py selfcheck --source "$script:SRC"

  Write-Host "==> tuning model A: $script:ModelE5Id"
  python run_benchmark.py tune --source "$script:SRC" --pg "$script:PG" --model-path "$script:ModelE5Dir" --model-id "$script:ModelE5Id"

  Write-Host "==> tuning model B: $script:ModelMiniId"
  python run_benchmark.py tune --source "$script:SRC" --pg "$script:PG" --model-path "$script:ModelMiniDir" --model-id "$script:ModelMiniId"

  Write-Host ""
  if (Test-Path winner.frozen.json) {
    Write-Host "A configuration PASSED all gates -> winner.frozen.json written."
    Write-Host "Next (only now): .\run-holdout.ps1"
  } else {
    Write-Host "No configuration cleared all gates on the 56-set. Nothing frozen; holdout must NOT be run."
  }
} finally { Stop-Pg }
