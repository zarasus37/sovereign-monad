[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$RootDomain,
    [Parameter(Mandatory = $true)]
    [string]$AcmeEmail
)

$ErrorActionPreference = 'Stop'

function Copy-IfMissing {
    param(
        [string]$Target,
        [string]$Example
    )

    if (-not (Test-Path -LiteralPath $Target)) {
        Copy-Item -LiteralPath $Example -Destination $Target -Force
        Write-Host "Prepared $Target"
    }
}

function Upsert-EnvValue {
    param(
        [string]$Path,
        [string]$Key,
        [string]$Value
    )

    $lines = @()
    if (Test-Path -LiteralPath $Path) {
        $lines = Get-Content -LiteralPath $Path
    }

    $updated = $false
    $result = foreach ($line in $lines) {
        if ($line -match "^$([regex]::Escape($Key))=") {
            $updated = $true
            "$Key=$Value"
        }
        else {
            $line
        }
    }

    if (-not $updated) {
        $result += "$Key=$Value"
    }

    Set-Content -LiteralPath $Path -Value $result
}

function Read-EnvFile {
    param([string]$Path)

    $map = @{}
    foreach ($line in Get-Content -LiteralPath $Path) {
        if (-not $line -or $line.TrimStart().StartsWith('#')) {
            continue
        }

        $parts = $line -split '=', 2
        if ($parts.Count -ne 2) {
            continue
        }

        $map[$parts[0].Trim()] = $parts[1].Trim()
    }

    return $map
}

Copy-IfMissing '.env.api' '.env.api.example'
Copy-IfMissing '.env.billing' '.env.billing.example'
Copy-IfMissing '.env.license-service' '.env.license-service.example'
Copy-IfMissing '.env.edge' '.env.edge.example'

Upsert-EnvValue '.env.edge' 'ROOT_DOMAIN' $RootDomain
Upsert-EnvValue '.env.edge' 'API_DOMAIN' "api.$RootDomain"
Upsert-EnvValue '.env.edge' 'BILLING_DOMAIN' "billing.$RootDomain"
Upsert-EnvValue '.env.edge' 'LICENSE_DOMAIN' "licenses.$RootDomain"
Upsert-EnvValue '.env.edge' 'ACME_EMAIL' $AcmeEmail

$edge = Read-EnvFile '.env.edge'
$billingDomain = $edge['BILLING_DOMAIN']
$licenseDomain = $edge['LICENSE_DOMAIN']

if (-not $billingDomain -or -not $licenseDomain) {
    throw 'Unable to derive BILLING_DOMAIN or LICENSE_DOMAIN from .env.edge'
}

Upsert-EnvValue '.env.billing' 'CHECKOUT_SUCCESS_URL' "https://$billingDomain/success?session_id={CHECKOUT_SESSION_ID}"
Upsert-EnvValue '.env.billing' 'CHECKOUT_CANCEL_URL' "https://$billingDomain/cancel"
Upsert-EnvValue '.env.billing' 'PORTAL_RETURN_URL' "https://$billingDomain/account"
Upsert-EnvValue '.env.license-service' 'PUBLIC_LICENSE_SERVER_URL' "https://$licenseDomain"

Write-Host 'Production env seed complete.'
