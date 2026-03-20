param(
    [string]$RepoRoot = "C:\Users\crisc\Dev\agents\monad-mev",
    [string]$StatusPath = "C:\Users\crisc\Dev\agents\monad-mev\STATUS.md",
    [string]$EnvPath = "C:\Users\crisc\Dev\agents\monad-mev\.env"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-EnvMap {
    param([string]$Path)

    $map = @{}
    if (-not (Test-Path $Path)) {
        return $map
    }

    foreach ($line in Get-Content $Path) {
        if ($line -match '^\s*#' -or $line -match '^\s*$') {
            continue
        }

        $parts = $line -split '=', 2
        if ($parts.Count -eq 2) {
            $map[$parts[0].Trim()] = $parts[1].Trim()
        }
    }

    return $map
}

function Get-ContainerRows {
    try {
        $rows = docker ps --format '{{.Names}}|{{.Status}}' 2>$null |
            Where-Object {
                $_ -like 'base-arb-mev-mainnet*' -or $_ -like 'monad-mev-mainnet*'
            } |
            Sort-Object
        return @($rows)
    } catch {
        return @()
    }
}

function Build-GeneratedSection {
    param(
        [hashtable]$EnvMap,
        [string[]]$ContainerRows
    )

    $timestamp = (Get-Date).ToUniversalTime().ToString('yyyy-MM-dd HH:mm:ss UTC')
    $lines = New-Object System.Collections.Generic.List[string]
    $lines.Add("Generated: $timestamp")
    $lines.Add("")
    $lines.Add("### Live Containers")
    $lines.Add("")

    if ($ContainerRows.Count -eq 0) {
        $lines.Add("No mainnet containers detected.")
    } else {
        $lines.Add("| Container | Status |")
        $lines.Add("|---|---|")
        foreach ($row in $ContainerRows) {
            $parts = $row -split '\|', 2
            if ($parts.Count -eq 2) {
                $lines.Add("| ``$($parts[0])`` | $($parts[1]) |")
            }
        }
    }

    $lines.Add("")
    $lines.Add("### Active Runtime Gates")
    $lines.Add("")
    $lines.Add('```env')
    foreach ($key in 'MIN_SPREAD_BPS','MIN_LIQUIDITY_10BPS_USD','MIN_CAPACITY_USD','MIN_SIZE_USD','RISK_FIXED_COST_BPS','RISK_MIN_EFFECTIVE_SPREAD_BPS','DRY_RUN','MAX_SINGLE_TRADE_PERCENT','MAX_BRIDGE_EXPOSURE_PERCENT','MAX_SLIPPAGE_BPS') {
        if ($EnvMap.ContainsKey($key)) {
            $lines.Add("$key=$($EnvMap[$key])")
        }
    }
    $lines.Add('```')

    return ($lines -join "`r`n")
}

$envMap = Get-EnvMap -Path $EnvPath
$containerRows = Get-ContainerRows

if (-not (Test-Path $StatusPath)) {
    throw "STATUS.md not found at $StatusPath"
}

$content = Get-Content $StatusPath -Raw
$generated = Build-GeneratedSection -EnvMap $envMap -ContainerRows $containerRows
$updated = [regex]::Replace(
    $content,
    '(?s)(<!-- AUTO-STATUS:START -->)(.*?)(<!-- AUTO-STATUS:END -->)',
    "`$1`r`n$generated`r`n`$3"
)

if ($updated -eq $content) {
    throw 'Auto-status markers not found in STATUS.md'
}

Set-Content -Path $StatusPath -Value $updated
Write-Output "Updated STATUS.md at $(Get-Date -Format s)"