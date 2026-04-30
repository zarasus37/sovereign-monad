param()

$ErrorActionPreference = 'Stop'

$canonicalPath = 'C:\Users\crisc\Dev\agents\sovereign-monad\docs\CANONICAL_SYNC_DISCIPLINE.md'
$mirrorPath = 'C:\Users\crisc\Dev\agents\monad-mev\docs\CANONICAL_SYNC_DISCIPLINE.md'

if (-not (Test-Path -LiteralPath $canonicalPath)) {
  throw "Canonical sync discipline doc not found: $canonicalPath"
}

$mirrorDir = Split-Path -Parent $mirrorPath
if (-not (Test-Path -LiteralPath $mirrorDir)) {
  New-Item -ItemType Directory -Path $mirrorDir | Out-Null
}

Copy-Item -LiteralPath $canonicalPath -Destination $mirrorPath -Force

$canonicalHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $canonicalPath).Hash
$mirrorHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $mirrorPath).Hash

if ($canonicalHash -ne $mirrorHash) {
  throw 'Canonical sync discipline mirror sync failed: canonical and mirror hashes do not match.'
}

Write-Host "Canonical: $canonicalPath"
Write-Host "Mirror:    $mirrorPath"
Write-Host "Canonical SHA256: $canonicalHash"
Write-Host "Mirror SHA256:    $mirrorHash"
Write-Host 'Canonical sync discipline mirror sync complete.'
