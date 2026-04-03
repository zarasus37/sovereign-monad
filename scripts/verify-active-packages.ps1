param()

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot

$checks = @(
  @{
    Name = 'risk-engine'
    Path = 'risk-engine'
    Commands = @('cmd /c npm run build', 'cmd /c npm test -- --runInBand', 'cmd /c npm run stress:matrix:report')
  },
  @{
    Name = 'monad-market-agent'
    Path = 'monad-market-agent'
    Commands = @('cmd /c npm run build', 'cmd /c npm test')
  },
  @{
    Name = 'slot-core'
    Path = 'slot-core'
    Commands = @('cmd /c npm run build', 'cmd /c npm test')
  },
  @{
    Name = 'slot-api'
    Path = 'slot-api'
    Commands = @('cmd /c npm run build', 'cmd /c npm test')
  },
  @{
    Name = 'slot-frontend'
    Path = 'slot-frontend'
    Commands = @('cmd /c npm run build')
  },
  @{
    Name = 'speech-gateway'
    Path = 'speech-gateway'
    Commands = @('cmd /c npm run build', 'cmd /c npm test')
  }
)

foreach ($check in $checks) {
  $targetPath = Join-Path $repoRoot $check.Path
  if (-not (Test-Path -LiteralPath $targetPath)) {
    throw "Missing package path: $targetPath"
  }

  Write-Host "==> Verifying $($check.Name)"
  foreach ($command in $check.Commands) {
    Write-Host " -> $command"
    Push-Location $targetPath
    try {
      Invoke-Expression $command
    }
    finally {
      Pop-Location
    }
  }
}

Write-Host 'All active package checks passed.'
