function Get-RepoRoot {
    param(
        [string]$StartPath
    )

    if (-not $StartPath) {
        if ($PSScriptRoot) {
            $StartPath = $PSScriptRoot
        }
        else {
            $StartPath = (Get-Location).Path
        }
    }

    $current = (Resolve-Path $StartPath).Path
    while (-not [string]::IsNullOrWhiteSpace($current)) {
        if (Test-Path (Join-Path $current 'docker-compose.mainnet.yml')) {
            return $current
        }

        $parent = Split-Path $current -Parent
        if ([string]::IsNullOrWhiteSpace($parent) -or $parent -eq $current) {
            break
        }
        $current = $parent
    }

    return $null
}

function Get-EnvFileMap {
    param(
        [string]$EnvFilePath
    )

    $map = @{}
    if ([string]::IsNullOrWhiteSpace($EnvFilePath) -or -not (Test-Path $EnvFilePath)) {
        return $map
    }

    foreach ($line in Get-Content $EnvFilePath) {
        $trimmed = $line.Trim()
        if (-not $trimmed -or $trimmed.StartsWith('#')) {
            continue
        }

        $parts = $trimmed -split '=', 2
        if ($parts.Count -eq 2) {
            $map[$parts[0].Trim()] = $parts[1].Trim()
        }
    }

    return $map
}

function Get-ActiveEnvMap {
    $repoRoot = Get-RepoRoot
    if (-not $repoRoot) {
        return @{}
    }
    $envFile = Join-Path $repoRoot '.env'
    return Get-EnvFileMap -EnvFilePath $envFile
}

function Test-HexAddress {
    param(
        [string]$Address
    )

    return $Address -match '^0x[a-fA-F0-9]{40}$'
}

function Convert-HexWeiToEth {
    param(
        [string]$HexValue
    )

    if (-not $HexValue) {
        return $null
    }

    $wei = [System.Numerics.BigInteger]::Parse($HexValue.Substring(2), [System.Globalization.NumberStyles]::AllowHexSpecifier)
    $divisor = [decimal]'1000000000000000000'
    return [decimal]$wei / $divisor
}

function Invoke-EvmJsonRpc {
    param(
        [Parameter(Mandatory = $true)]
        [string]$RpcUrl,

        [Parameter(Mandatory = $true)]
        [string]$Method,

        [object[]]$Params = @()
    )

    $body = @{
        jsonrpc = '2.0'
        id = 1
        method = $Method
        params = $Params
    } | ConvertTo-Json -Depth 5

    return Invoke-RestMethod -Uri $RpcUrl -Method Post -ContentType 'application/json' -Body $body
}