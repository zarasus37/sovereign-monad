[CmdletBinding()]
param(
    [int]$SampleSeconds = 3,
    [string]$KafkaContainer = 'base-arb-mev-mainnet-kafka'
)

. (Join-Path $PSScriptRoot 'common.ps1')

$repoRoot = Get-RepoRoot -StartPath $PSScriptRoot
if (-not $repoRoot) {
    throw 'Could not determine repository root.'
}

$topics = @(
    'market.base.price-snapshot',
    'market.arbitrum.price-snapshot',
    'market.spread.signal',
    'risk.opportunity-candidate',
    'risk.opportunity-evaluation',
    'execution.execution-result'
)

function Get-TopicOffsetTotal {
    param(
        [string]$ContainerName,
        [string]$TopicName
    )

    $output = docker exec $ContainerName sh -lc "kafka-run-class kafka.tools.GetOffsetShell --broker-list localhost:9092 --topic $TopicName 2>/dev/null"
    if (-not $output) {
        return $null
    }

    $total = 0L
    foreach ($line in ($output -split "`r?`n")) {
        if (-not $line) {
            continue
        }

        $parts = $line -split ':'
        if ($parts.Count -lt 3) {
            continue
        }

        $offset = 0L
        if ([long]::TryParse($parts[2], [ref]$offset)) {
            $total += $offset
        }
    }

    return $total
}

function Get-FlowVerdict {
    param(
        [long]$Delta,
        [string]$TopicName
    )

    if ($Delta -gt 0) {
        return 'active'
    }

    if ($TopicName -in @('risk.opportunity-evaluation', 'execution.execution-result')) {
        return 'quiet'
    }

    return 'idle'
}

Push-Location $repoRoot
try {
    $container = docker ps --format '{{.Names}}' 2>$null | Where-Object { $_ -eq $KafkaContainer } | Select-Object -First 1
    if (-not $container) {
        throw "Kafka container not running: $KafkaContainer"
    }

    $before = @{}
    foreach ($topic in $topics) {
        $before[$topic] = Get-TopicOffsetTotal -ContainerName $container -TopicName $topic
    }

    Start-Sleep -Seconds $SampleSeconds

    $summary = foreach ($topic in $topics) {
        $first = $before[$topic]
        $second = Get-TopicOffsetTotal -ContainerName $container -TopicName $topic

        $delta = if ($null -ne $first -and $null -ne $second) { $second - $first } else { $null }

        [pscustomobject]@{
            Topic = $topic
            StartOffset = $first
            EndOffset = $second
            Delta = $delta
            Status = if ($null -eq $delta) { 'unavailable' } else { Get-FlowVerdict -Delta $delta -TopicName $topic }
        }
    }

    Write-Host "Kafka topic flow summary over ${SampleSeconds}s"
    $summary | Format-Table -AutoSize
}
finally {
    Pop-Location
}