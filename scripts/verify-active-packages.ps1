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
    Name = 'organ-runtime'
    Path = 'organ-runtime'
    Commands = @('cmd /c npm run build', 'cmd /c npm test')
  },
  @{
    Name = 'signal-layer'
    Path = 'signal-layer'
    Commands = @('cmd /c npm run build', 'cmd /c npm test')
  },
  @{
    Name = 'oracle-core'
    Path = 'oracle-core'
    Commands = @('cmd /c npm run build', 'cmd /c npm test')
  },
  @{
    Name = 'gnosis-core'
    Path = 'gnosis-core'
    Commands = @('cmd /c npm run build', 'cmd /c npm test')
  },
  @{
    Name = 'boundary-stress-monitor'
    Path = 'boundary-stress-monitor'
    Commands = @('cmd /c npm run build', 'cmd /c npm test')
  },
  @{
    Name = 'ecosystem-state-api'
    Path = 'ecosystem-state-api'
    Commands = @('cmd /c npm run build', 'cmd /c npm test')
  },
  @{
    Name = 'ecosystem-dashboard'
    Path = 'ecosystem-dashboard'
    Commands = @('cmd /c npm run build')
  },
  @{
    Name = 'platform-builder'
    Path = 'platform-builder'
    Commands = @('cmd /c npm run build', 'cmd /c npm test')
  },
  @{
    Name = 'expansion-control'
    Path = 'expansion-control'
    Commands = @('cmd /c npm run build', 'cmd /c npm test')
  },
  @{
    Name = 'keys-core'
    Path = 'keys-core'
    Commands = @('cmd /c npm run build', 'cmd /c npm test')
  },
  @{
    Name = 'data-rail-core'
    Path = 'data-rail-core'
    Commands = @('cmd /c npm run build', 'cmd /c npm test')
  },
  @{
    Name = 'data-rail-router'
    Path = 'data-rail-router'
    Commands = @('cmd /c npm run build', 'cmd /c npm test')
  },
  @{
    Name = 'reward-ledger-core'
    Path = 'reward-ledger-core'
    Commands = @('cmd /c npm run build', 'cmd /c npm test')
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
      if ($LASTEXITCODE -ne 0) {
        throw "Command failed with exit code $LASTEXITCODE: $command"
      }
    }
    finally {
      Pop-Location
    }
  }
}

Write-Host 'All active package checks passed.'
