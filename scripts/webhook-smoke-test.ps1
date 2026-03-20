[CmdletBinding()]
param(
    [ValidateSet('discord','slack','all')]
    [string]$Target = 'all',

    [string]$Message = 'SMMEVAE webhook smoke test',

    [switch]$PreviewOnly
)

. (Join-Path $PSScriptRoot 'common.ps1')

$envMap = Get-ActiveEnvMap
$discord = $envMap['DISCORD_WEBHOOK_URL']
$slack = $envMap['SLACK_WEBHOOK_URL']

$targets = @()
if ($Target -in @('discord', 'all')) {
    $targets += [pscustomobject]@{ Name = 'Discord'; Url = $discord }
}
if ($Target -in @('slack', 'all')) {
    $targets += [pscustomobject]@{ Name = 'Slack'; Url = $slack }
}

foreach ($targetConfig in $targets) {
    if (-not $targetConfig.Url) {
        Write-Warning "$($targetConfig.Name) webhook URL is not set in .env"
        continue
    }

    if ($PreviewOnly) {
        Write-Host "Would send smoke test to $($targetConfig.Name)"
        continue
    }

    try {
        if ($targetConfig.Name -eq 'Discord') {
            $body = @{
                embeds = @(@{
                    title = 'SMMEVAE Smoke Test'
                    description = $Message
                    color = 3447003
                    timestamp = (Get-Date).ToUniversalTime().ToString('o')
                })
            } | ConvertTo-Json -Depth 5
        }
        else {
            $body = @{
                text = ":bell: $Message"
                username = 'SMMEVAE Smoke Test'
            } | ConvertTo-Json -Depth 5
        }

        $response = Invoke-WebRequest -Uri $targetConfig.Url -Method Post -ContentType 'application/json' -Body $body -UseBasicParsing
        Write-Host "$($targetConfig.Name) webhook responded with HTTP $($response.StatusCode)"
    }
    catch {
        Write-Error "$($targetConfig.Name) webhook failed: $($_.Exception.Message)"
    }
}