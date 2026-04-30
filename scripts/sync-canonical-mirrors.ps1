param()

$ErrorActionPreference = 'Stop'

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

$scripts = @(
  'sync-mof-mirror.ps1',
  'sync-build-map-mirror.ps1',
  'sync-build-execution-flow-mirror.ps1',
  'sync-funnel-diversification-plan-mirror.ps1',
  'sync-canonical-sync-discipline-mirror.ps1',
  'sync-candidate-standard-kernel-v0-mirror.ps1'
)

foreach ($scriptName in $scripts) {
  $scriptPath = Join-Path $scriptRoot $scriptName
  if (-not (Test-Path -LiteralPath $scriptPath)) {
    throw "Required sync script not found: $scriptPath"
  }

  Write-Host "Running $scriptName ..."
  & powershell -ExecutionPolicy Bypass -File $scriptPath
}

Write-Host 'All canonical mirrors synced.'
