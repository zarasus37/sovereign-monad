[CmdletBinding()]
param(
    [string]$OutputDir = '.\backups'
)

$ErrorActionPreference = 'Stop'

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$targetDir = Join-Path $OutputDir $timestamp
New-Item -ItemType Directory -Path $targetDir -Force | Out-Null

Copy-Item -LiteralPath '..\api\config\api-keys.json' -Destination (Join-Path $targetDir 'api-keys.json') -Force
Copy-Item -LiteralPath '..\license-service\config\licenses.json' -Destination (Join-Path $targetDir 'licenses.json') -Force

Write-Host "Backed up shared commercial state to $targetDir"
