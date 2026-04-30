[CmdletBinding()]
param(
    [switch]$AllowPlaceholders,
    [switch]$Edge
)

$ErrorActionPreference = 'Stop'

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

function Assert-Exists {
    param([string]$Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        throw "Missing required file: $Path"
    }
}

function Assert-NonPlaceholder {
    param(
        [hashtable]$Map,
        [string[]]$Keys,
        [string]$Label
    )

    $placeholderPatterns = @(
        'placeholder',
        'your-domain.example',
        'sk_test_your_key',
        'whsec_your_secret',
        '^price_starter$',
        '^price_pro$',
        '^price_fund$',
        '^price_enterprise$',
        '^price_starter_monthly$',
        '^price_starter_annual$',
        '^price_pro_monthly$',
        '^price_pro_annual$',
        '^price_fund_monthly$',
        '^price_fund_annual$',
        '^price_enterprise_monthly$',
        '^price_enterprise_annual$'
    )

    foreach ($key in $Keys) {
        $value = $Map[$key]
        if (-not $value) {
            throw "$Label missing required value: $key"
        }

        if (-not $AllowPlaceholders) {
            foreach ($pattern in $placeholderPatterns) {
                if ($value -match $pattern) {
                    throw "$Label still uses a placeholder value for $key"
                }
            }
        }
    }
}

function Assert-OptionalNonPlaceholder {
    param(
        [hashtable]$Map,
        [string[]]$Keys,
        [string]$Label
    )

    $present = @()
    foreach ($key in $Keys) {
        $value = $Map[$key]
        if (
            $value -and
            $value -notmatch 'placeholder' -and
            $value -notmatch '^price_fund_monthly$' -and
            $value -notmatch '^price_fund_annual$' -and
            $value -notmatch '^price_enterprise_monthly$' -and
            $value -notmatch '^price_enterprise_annual$'
        ) {
            $present += $key
        }
    }

    if ($present.Count -eq 0) {
        return
    }

    Assert-NonPlaceholder -Map $Map -Keys $present -Label $Label
}

Assert-Exists '.env.api'
Assert-Exists '.env.billing'
Assert-Exists '.env.license-service'
Assert-Exists '..\api\config\api-keys.json'
Assert-Exists '..\billing\config\inquiries.json'
Assert-Exists '..\license-service\config\licenses.json'

if ($Edge) {
    Assert-Exists '.env.edge'
}

$null = docker info | Out-Null

$billing = Read-EnvFile '.env.billing'
$licenseService = Read-EnvFile '.env.license-service'
$edgeEnv = @{}

if ($Edge) {
    $edgeEnv = Read-EnvFile '.env.edge'
}

Assert-NonPlaceholder -Map $billing -Keys @(
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'STRIPE_STARTER_MONTHLY_PRICE_ID',
    'STRIPE_STARTER_ANNUAL_PRICE_ID',
    'STRIPE_PRO_MONTHLY_PRICE_ID',
    'STRIPE_PRO_ANNUAL_PRICE_ID',
    'CHECKOUT_SUCCESS_URL',
    'CHECKOUT_CANCEL_URL',
    'PORTAL_RETURN_URL'
) -Label '.env.billing'

Assert-OptionalNonPlaceholder -Map $billing -Keys @(
    'STRIPE_FUND_MONTHLY_PRICE_ID',
    'STRIPE_FUND_ANNUAL_PRICE_ID',
    'STRIPE_ENTERPRISE_MONTHLY_PRICE_ID',
    'STRIPE_ENTERPRISE_ANNUAL_PRICE_ID'
) -Label '.env.billing'

Assert-NonPlaceholder -Map $licenseService -Keys @(
    'PUBLIC_LICENSE_SERVER_URL'
) -Label '.env.license-service'

if ($Edge) {
    Assert-NonPlaceholder -Map $edgeEnv -Keys @(
        'ROOT_DOMAIN',
        'API_DOMAIN',
        'BILLING_DOMAIN',
        'LICENSE_DOMAIN',
        'ACME_EMAIL'
    ) -Label '.env.edge'
}

Write-Host 'Commercial stack preflight passed.'
