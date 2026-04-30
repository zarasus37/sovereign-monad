param(
  [string]$BootstrapAddress = '0x9d4fcf7E0Ae5AE994A6eb0bCCbDfAA62E5867352',
  [string]$OutputPath = 'gamefi-control-core/config/gamefi-source.json',
  [switch]$Force
)

$ErrorActionPreference = 'Stop'

if ($BootstrapAddress -notmatch '^0x[a-fA-F0-9]{40}$') {
  throw "BootstrapAddress is not a valid 0x address: $BootstrapAddress"
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$resolvedOutputPath = Join-Path $repoRoot $OutputPath
$outputDir = Split-Path -Parent $resolvedOutputPath

if ((Test-Path -LiteralPath $resolvedOutputPath) -and -not $Force) {
  throw "Target already exists: $resolvedOutputPath`nUse -Force to overwrite."
}

if (-not (Test-Path -LiteralPath $outputDir)) {
  New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

$config = [ordered]@{
  sources = [ordered]@{
    bootstrap = [ordered]@{
      address = $BootstrapAddress
      label = 'Bootstrap Revenue Source'
      active = $true
      note = 'Temporary source used until the Stake-linked source exists on-chain and is registered.'
    }
    stake = [ordered]@{
      address = $null
      label = 'Stake-Linked Revenue Source'
      active = $false
      note = 'Do not activate until the Stake-linked source is deployed and registered.'
    }
  }
  cutover = [ordered]@{
    revokeBootstrapOnCutover = $false
  }
}

$json = $config | ConvertTo-Json -Depth 6
[System.IO.File]::WriteAllText($resolvedOutputPath, $json + [Environment]::NewLine, [System.Text.UTF8Encoding]::new($false))

Write-Host "Wrote GameFi bootstrap config to $resolvedOutputPath"
