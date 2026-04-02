[CmdletBinding()]
param(
    [string]$ApiKey = 'starter-demo-key',
    [string]$LicenseKey = 'SMEV-ENTERPRISE-BETA',
    [string]$MachineId = 'commercial-stack-verify',
    [int]$MaxWaitSeconds = 60
)

$ErrorActionPreference = 'Stop'

function Wait-ForHealth {
    param(
        [string]$Uri,
        [int]$MaxSeconds
    )

    $deadline = (Get-Date).AddSeconds($MaxSeconds)

    while ((Get-Date) -lt $deadline) {
        try {
            return Invoke-RestMethod -Uri $Uri
        }
        catch {
            Start-Sleep -Seconds 2
        }
    }

    throw "Timed out waiting for $Uri"
}

$apiHealth = Wait-ForHealth -Uri 'http://127.0.0.1:3000/health' -MaxSeconds $MaxWaitSeconds
$apiConfig = Invoke-RestMethod -Uri 'http://127.0.0.1:3000/config' -Headers @{ 'x-api-key' = $ApiKey }
$apiEvalBody = @{
    direction = 'buy_M_sell_E'
    spreadBps = 35
    bridgeDelaySec = 4
    sizeSuggestionUsd = 500
    clientAumUsd = 1000000
    mode = 'bridge_based'
} | ConvertTo-Json -Compress
$apiEval = Invoke-RestMethod -Uri 'http://127.0.0.1:3000/evaluate' -Method Post -Headers @{ 'x-api-key' = $ApiKey } -ContentType 'application/json' -Body $apiEvalBody

$billingHealth = Wait-ForHealth -Uri 'http://127.0.0.1:3010/health' -MaxSeconds $MaxWaitSeconds
$licenseHealth = Wait-ForHealth -Uri 'http://127.0.0.1:4010/health' -MaxSeconds $MaxWaitSeconds

$activateBody = @{
    licenseKey = $LicenseKey
    machineId = $MachineId
} | ConvertTo-Json -Compress
$licenseActivate = Invoke-RestMethod -Uri 'http://127.0.0.1:4010/licenses/activate' -Method Post -ContentType 'application/json' -Body $activateBody

$validateBody = @{
    licenseKey = $LicenseKey
    machineId = $MachineId
    activationId = $licenseActivate.activation.activationId
} | ConvertTo-Json -Compress
$licenseValidate = Invoke-RestMethod -Uri 'http://127.0.0.1:4010/licenses/validate' -Method Post -ContentType 'application/json' -Body $validateBody

[pscustomobject]@{
    apiHealth = $apiHealth
    apiConfig = $apiConfig
    apiEvaluate = $apiEval
    billingHealth = $billingHealth
    licenseHealth = $licenseHealth
    licenseActivate = $licenseActivate
    licenseValidate = $licenseValidate
} | ConvertTo-Json -Depth 6
