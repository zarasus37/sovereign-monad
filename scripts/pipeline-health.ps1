[CmdletBinding()]
param(
    [string]$ComposeFile = 'docker-compose.mainnet.yml',
    [int]$RecentLogLines = 5
)

. (Join-Path $PSScriptRoot 'common.ps1')

$repoRoot = Get-RepoRoot -StartPath $PSScriptRoot
$composePath = Join-Path $repoRoot $ComposeFile

if (-not (Test-Path $composePath)) {
    throw "Compose file not found: $composePath"
}

Push-Location $repoRoot
try {
    $rows = docker ps --format '{{.Names}}|{{.Status}}' 2>$null |
        Where-Object { $_ -like 'base-arb-mev-mainnet-*' }

    if (-not $rows) {
        Write-Host 'No active Base/Arbitrum mainnet containers are currently running.'
        exit 1
    }

    $containers = foreach ($row in $rows) {
        $parts = $row -split '\|', 2
        $name = $parts[0]
        $status = if ($parts.Count -gt 1) { $parts[1] } else { '' }
        [pscustomobject]@{
            Name = $name
            Status = $status
        }
    }

    Write-Host "Active Base/Arbitrum containers from $ComposeFile"
    $containers | Format-Table -AutoSize

    $critical = @(
        'base-arb-mev-mainnet-base-agent',
        'base-arb-mev-mainnet-arbitrum-agent',
        'base-arb-mev-mainnet-spread-scanner',
        'base-arb-mev-mainnet-opp-constructor',
        'base-arb-mev-mainnet-risk-engine',
        'base-arb-mev-mainnet-portfolio',
        'base-arb-mev-mainnet-arb-bot',
        'base-arb-mev-mainnet-feedback',
        'base-arb-mev-mainnet-alert-rules'
    )

    $degraded = $containers | Where-Object {
        $_.Name -in $critical -and $_.Status -notmatch '^Up '
    }

    if ($degraded) {
        Write-Warning 'Some critical services are degraded.'
        $degraded | Format-Table -AutoSize
    }

    foreach ($service in $critical) {
        $match = $containers | Where-Object Name -eq $service | Select-Object -First 1
        if (-not $match) { continue }

        Write-Host "`nRecent logs for $service"
        docker logs $match.Name --tail $RecentLogLines 2>$null | Out-String | Write-Host
    }
}
finally {
    Pop-Location
}