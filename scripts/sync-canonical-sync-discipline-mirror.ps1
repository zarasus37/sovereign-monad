param()

$ErrorActionPreference = 'Stop'

$canonicalPath = 'C:\Users\crisc\Dev\agents\sovereign-monad\docs\CANONICAL_SYNC_DISCIPLINE.md'
$mirrorPath = 'C:\Users\crisc\Dev\agents\monad-mev\docs\CANONICAL_SYNC_DISCIPLINE.md'

if (-not (Test-Path -LiteralPath $canonicalPath)) {
  throw "Canonical sync discipline doc not found: $canonicalPath"
}

$canonicalContent = Get-Content -LiteralPath $canonicalPath -Raw -Encoding UTF8

$mirrorBanner = @'
> Local mirror kept in `monad-mev` for operator convenience.
> Canonical maintenance target: `C:\Users\crisc\Dev\agents\sovereign-monad\docs\CANONICAL_SYNC_DISCIPLINE.md`
> If the two copies ever diverge, the `sovereign-monad` copy wins and this mirror must be resynced.
>
'@

$lines = $canonicalContent -split "`r?`n"
if ($lines.Length -lt 1) {
  throw 'Canonical sync discipline document is empty.'
}

$header = $lines[0]
$body = if ($lines.Length -gt 1) { ($lines[1..($lines.Length - 1)] -join "`r`n") } else { '' }

$mirrorContent = @(
  $header
  ''
  $mirrorBanner.TrimEnd()
  $body
) -join "`r`n"

$mirrorDir = Split-Path -Parent $mirrorPath
if (-not (Test-Path -LiteralPath $mirrorDir)) {
  New-Item -ItemType Directory -Path $mirrorDir | Out-Null
}

Set-Content -LiteralPath $mirrorPath -Value $mirrorContent -Encoding UTF8

$canonicalHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $canonicalPath).Hash
$mirrorHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $mirrorPath).Hash

Write-Host "Canonical: $canonicalPath"
Write-Host "Mirror:    $mirrorPath"
Write-Host "Canonical SHA256: $canonicalHash"
Write-Host "Mirror SHA256:    $mirrorHash"
Write-Host 'Canonical sync discipline mirror sync complete.'
