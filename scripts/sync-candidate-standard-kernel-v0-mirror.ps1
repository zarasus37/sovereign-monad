param()

$ErrorActionPreference = 'Stop'

$canonicalPath = 'C:\Users\crisc\Dev\agents\sovereign-monad\docs\CANDIDATE_STANDARD_KERNEL_V0.md'
$mirrorPath = 'C:\Users\crisc\Dev\agents\monad-mev\docs\CANDIDATE_STANDARD_KERNEL_V0.md'

if (-not (Test-Path -LiteralPath $canonicalPath)) {
  throw "Canonical candidate kernel doc not found: $canonicalPath"
}

$canonicalContent = Get-Content -LiteralPath $canonicalPath -Raw -Encoding UTF8

$mirrorBanner = @'
This is a local mirror of the candidate standard kernel v0 artifact for workspace use in `monad-mev`.

Canonical maintenance target:

- `C:\Users\crisc\Dev\agents\sovereign-monad\docs\CANDIDATE_STANDARD_KERNEL_V0.md`

If this mirror and the canonical copy diverge, the `sovereign-monad` version wins and this mirror should be resynced.
'@

$lines = $canonicalContent -split "`r?`n"
if ($lines.Length -lt 1) {
  throw 'Canonical candidate kernel doc is empty.'
}

$mirrorContent = @(
  '# Candidate Standard Kernel v0 Mirror'
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
Write-Host 'Candidate standard kernel mirror sync complete.'
