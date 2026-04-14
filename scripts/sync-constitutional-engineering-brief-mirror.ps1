param()

$ErrorActionPreference = 'Stop'

$canonicalPath = 'C:\Users\crisc\Dev\agents\sovereign-monad\docs\CONSTITUTIONAL_ENGINEERING_BRIEF.md'
$mirrorPath = 'C:\Users\crisc\Dev\agents\monad-mev\docs\CONSTITUTIONAL_ENGINEERING_BRIEF.md'

if (-not (Test-Path -LiteralPath $canonicalPath)) {
  throw "Canonical Constitutional Engineering Brief not found: $canonicalPath"
}

$canonicalContent = Get-Content -LiteralPath $canonicalPath -Raw -Encoding UTF8

$lines = $canonicalContent -split "`r?`n"
if ($lines.Length -lt 1) {
  throw 'Canonical Constitutional Engineering Brief is empty.'
}

$header = $lines[0]
$body = if ($lines.Length -gt 1) { ($lines[1..($lines.Length - 1)] -join "`r`n") } else { '' }

$mirrorContent = @(
  $header
  ''
  '> Local mirror kept in `monad-mev` for operator convenience.'
  '> Canonical maintenance target: `C:\Users\crisc\Dev\agents\sovereign-monad\docs\CONSTITUTIONAL_ENGINEERING_BRIEF.md`'
  '> If the two copies ever diverge, the `sovereign-monad` copy wins and this mirror must be resynced.'
  '>'
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
Write-Host 'Constitutional engineering brief mirror sync complete.'
