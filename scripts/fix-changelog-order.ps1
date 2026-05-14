$mofPath = "c:\Users\crisc\Dev\agents\monad-mev\docs\SOVEREIGN_MONAD_ECOSYSTEM_MASTER_OPERATING_FILE_v2.3.0.md"

$content = Get-Content $mofPath -Raw

# The correct block to replace: the broken v2.3.28(Apr23) v2.3.29(Apr30) bad-v2.3.28(May14) v2.3.27(Apr21)
# We'll use line-based approach for precision

$lines = $content -split "`n"

# Find the key line indices (0-based)
$start28apr = ($lines | Select-String -Pattern "^## v2\.3\.28 — April 23, 2026" | Select-Object -First 1).LineNumber - 1
$start29apr = ($lines | Select-String -Pattern "^## v2\.3\.29 — April 30, 2026" | Select-Object -First 1).LineNumber - 1
$start28may = ($lines | Select-String -Pattern "^## v2\.3\.28 — May 14, 2026" | Select-Object -First 1).LineNumber - 1
$start27apr = ($lines | Select-String -Pattern "^## v2\.3\.27 — April 21, 2026" | Select-Object -First 1).LineNumber - 1
$start25apr = ($lines | Select-String -Pattern "^## v2\.3\.25 — April 15, 2026" | Select-Object -First 1).LineNumber - 1

Write-Host "v2.3.28 Apr: $start28apr | v2.3.29 Apr: $start29apr | v2.3.28 May: $start28may | v2.3.27 Apr: $start27apr | v2.3.25 Apr: $start25apr"

# Extract each section (lines up to but not including the next section's header)
$block27 = $lines[$start27apr..($start25apr - 2)]   # v2.3.27 block
$block28 = $lines[$start28apr..($start29apr - 2)]   # v2.3.28 April block
$block29 = $lines[$start29apr..($start28may - 2)]   # v2.3.29 block
$block30 = $lines[$start28may..($start27apr - 2)]   # bad v2.3.28 May = becomes v2.3.30

# Fix the version number in block30
$block30 = $block30 | ForEach-Object { $_ -replace "^## v2\.3\.28 — May 14, 2026", "## v2.3.30 — May 14, 2026" }
# Fix the escaped backslashes in the May entry (was double-escaped in PowerShell strings)
$block30 = $block30 | ForEach-Object { $_ -replace "C:\\\\", "C:\" -replace "G:\\\\", "G:\" }

# Build the replacement: correct order is v2.3.27, v2.3.28, v2.3.29, v2.3.30
$before = $lines[0..($start28apr - 2)]
$after  = $lines[$start25apr..($lines.Length - 1)]

$newLines = $before + @("") + $block27 + @("") + $block28 + @("") + $block29 + @("") + $block30 + @("") + $after

$newContent = $newLines -join "`n"
Set-Content -Path $mofPath -Value $newContent -NoNewline -Encoding UTF8

Write-Host "Done. Verifying order..."
Get-Content $mofPath | Select-String "## v2.3.2" | Select-Object LineNumber, Line
