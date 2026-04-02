[CmdletBinding()]
param(
    [switch]$RefreshEnvFiles,
    [switch]$Prod,
    [switch]$Edge
)

$ErrorActionPreference = 'Stop'

function Copy-EnvFile {
    param(
        [string]$ExampleName,
        [string]$TargetName
    )

    if ($RefreshEnvFiles -or -not (Test-Path -LiteralPath $TargetName)) {
        Copy-Item -LiteralPath $ExampleName -Destination $TargetName -Force
        Write-Host "Prepared $TargetName from $ExampleName"
    }
}

Copy-EnvFile '.env.api.example' '.env.api'
Copy-EnvFile '.env.billing.example' '.env.billing'
Copy-EnvFile '.env.license-service.example' '.env.license-service'

if ($Edge) {
    Copy-EnvFile '.env.edge.example' '.env.edge'
}

$composeFiles = @('-f', 'docker-compose.yml')

if ($Edge) {
    $composeFiles += @('-f', 'docker-compose.edge.yml')
}
elseif ($Prod) {
    $composeFiles += @('-f', 'docker-compose.prod.yml')
}
else {
    $composeFiles += @('-f', 'docker-compose.local.yml')
}

docker-compose @composeFiles up -d --build
