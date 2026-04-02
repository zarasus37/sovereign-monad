param()

$ErrorActionPreference = 'Stop'

$canonicalPath = 'C:\Users\crisc\Dev\agents\sovereign-monad\docs\ECOSYSTEM_BUILD_MAP.md'
$mirrorPath = 'C:\Users\crisc\Dev\agents\monad-mev\docs\ECOSYSTEM_BUILD_MAP.md'

if (-not (Test-Path -LiteralPath $canonicalPath)) {
  throw "Canonical build map not found: $canonicalPath"
}

$canonicalContent = Get-Content -LiteralPath $canonicalPath -Raw -Encoding UTF8

$mirrorBanner = @'
This is a local mirror of the ecosystem build map for runtime-side work in `monad-mev`.

Canonical maintenance target:

- `C:\Users\crisc\Dev\agents\sovereign-monad\docs\ECOSYSTEM_BUILD_MAP.md`

If this mirror and the canonical copy diverge, the `sovereign-monad` version wins and this mirror should be resynced.
'@

$lines = $canonicalContent -split "`r?`n"
if ($lines.Length -lt 1) {
  throw 'Canonical build map is empty.'
}

$mirrorContent = @(
  '# Ecosystem Build Map Mirror'
  ''
  $mirrorBanner.TrimEnd()
  ''
  '---'
  ''
  ($lines[1..($lines.Length - 1)] -join "`r`n")
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
Write-Host 'Build map mirror sync complete.'
