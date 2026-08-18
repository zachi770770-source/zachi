# Shared helpers for run-benchmark.ps1 / run-holdout.ps1 (Windows PowerShell).
$ErrorActionPreference = "Stop"

$script:PgContainer = "compass-bench-pg"
$script:StartedPg   = $false
$script:ModelE5Id   = "intfloat/multilingual-e5-small"
$script:ModelE5Dir  = "models/multilingual-e5-small"
$script:ModelMiniId = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
$script:ModelMiniDir= "models/paraphrase-multilingual-MiniLM-L12-v2"

function Set-OfflineEnv {
  $env:TRANSFORMERS_OFFLINE = "1"; $env:HF_HUB_OFFLINE = "1"
  $env:HF_HUB_DISABLE_TELEMETRY = "1"; $env:TOKENIZERS_PARALLELISM = "false"
}

function Enable-Venv {
  if (-not (Test-Path ".venv")) { Write-Error "Run .\setup-benchmark.ps1 first."; exit 1 }
  . .\.venv\Scripts\Activate.ps1
}

function Resolve-Source {
  if (-not $env:COMPASS_SOURCE) { Write-Error "Set COMPASS_SOURCE to your canonical .docx or .source.json (stays local)."; exit 1 }
  New-Item -ItemType Directory -Force -Path ".local" | Out-Null
  if ($env:COMPASS_SOURCE -like "*.docx") {
    $script:SRC = ".local/medaytim-laahava-888-final.source.json"
    Write-Host "==> converting DOCX -> source.json locally (never uploaded)"
    python convert.py --docx "$env:COMPASS_SOURCE" --out "$script:SRC"
  } elseif ($env:COMPASS_SOURCE -like "*.json") {
    $script:SRC = $env:COMPASS_SOURCE
  } else { Write-Error "COMPASS_SOURCE must end in .docx or .json"; exit 1 }
}

function Start-Pg {
  if ($env:COMPASS_PG) { $script:PG = $env:COMPASS_PG; Write-Host "==> using COMPASS_PG"; return }
  if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host "==> starting throwaway Postgres (Docker)"
    docker rm -f $script:PgContainer 2>$null | Out-Null
    docker run -d --name $script:PgContainer -e POSTGRES_PASSWORD=bench -p 55432:5432 postgres:16 | Out-Null
    $script:StartedPg = $true
    $script:PG = "postgresql://postgres:bench@127.0.0.1:55432/postgres"
    Write-Host -NoNewline "   waiting for Postgres"
    foreach ($i in 1..60) {
      docker exec $script:PgContainer pg_isready -U postgres 2>$null | Out-Null
      if ($LASTEXITCODE -eq 0) { Write-Host " ready"; return }
      Write-Host -NoNewline "."; Start-Sleep -Seconds 1
    }
    Write-Error "Postgres did not become ready"; exit 1
  }
  Write-Error "No Postgres. Install Docker Desktop, or set COMPASS_PG to a Postgres DSN."; exit 1
}

function Stop-Pg { if ($script:StartedPg) { docker rm -f $script:PgContainer 2>$null | Out-Null } }
