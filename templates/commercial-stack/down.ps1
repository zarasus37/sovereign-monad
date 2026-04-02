[CmdletBinding()]
param(
    [switch]$Prod,
    [switch]$Edge
)

$ErrorActionPreference = 'Stop'

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

docker-compose @composeFiles down
