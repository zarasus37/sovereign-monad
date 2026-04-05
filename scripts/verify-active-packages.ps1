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
    Name = 'dao-core'
    Path = 'dao-core'
    Commands = @('cmd /c npm run build', 'cmd /c npm test')
  },
  @{
    Name = 'keys-nft-core'
    Path = 'keys-nft-core'
    Commands = @('cmd /c npm run build', 'cmd /c npm test')
  },
  @{
    Name = 'narrative-core'
    Path = 'narrative-core'
    Commands = @('cmd /c npm run build', 'cmd /c npm test')
  },
  @{
    Name = 'dove-integration-core'
    Path = 'dove-integration-core'
    Commands = @('cmd /c npm run build', 'cmd /c npm test')
  },
  @{
    Name = 'gnosis-evaluator-core'
    Path = 'gnosis-evaluator-core'
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
    Name = 'data-rail-governance'
    Path = 'data-rail-governance'
    Commands = @('cmd /c npm run build', 'cmd /c npm test')
  },
  @{
    Name = 'data-product-core'
    Path = 'data-product-core'
    Commands = @('cmd /c npm run build', 'cmd /c npm test')
  },
  @{
    Name = 'population-growth-core'
    Path = 'population-growth-core'
    Commands = @('cmd /c npm run build', 'cmd /c npm test')
  },
  @{
    Name = 'rights-review-core'
    Path = 'rights-review-core'
    Commands = @('cmd /c npm run build', 'cmd /c npm test')
  },
  @{
    Name = 'externalization-readiness-core'
    Path = 'externalization-readiness-core'
    Commands = @('cmd /c npm run build', 'cmd /c npm test')
  },
  @{
    Name = 'activation-decision-core'
    Path = 'activation-decision-core'
    Commands = @('cmd /c npm run build', 'cmd /c npm test')
  },
  @{
    Name = 'execution-truth-core'
    Path = 'execution-truth-core'
    Commands = @('cmd /c npm run build', 'cmd /c npm test')
  },
  @{
    Name = 'cardia-activation-core'
    Path = 'cardia-activation-core'
    Commands = @('cmd /c npm run build', 'cmd /c npm test')
  },
  @{
    Name = 'population-expansion-core'
    Path = 'population-expansion-core'
    Commands = @('cmd /c npm run build', 'cmd /c npm test')
  },
  @{
    Name = 'public-activation-core'
    Path = 'public-activation-core'
    Commands = @('cmd /c npm run build', 'cmd /c npm test')
  },
  @{
    Name = 'emergence-observer-core'
    Path = 'emergence-observer-core'
    Commands = @('cmd /c npm run build', 'cmd /c npm test')
  },
  @{
    Name = 'emergence-baseline-core'
    Path = 'emergence-baseline-core'
    Commands = @('cmd /c npm run build', 'cmd /c npm test')
  },
  @{
    Name = 'emergence-accumulator-core'
    Path = 'emergence-accumulator-core'
    Commands = @('cmd /c npm run build', 'cmd /c npm test')
  },
  @{
    Name = 'emergent-protocol-core'
    Path = 'emergent-protocol-core'
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
        throw "Command failed with exit code ${LASTEXITCODE}: $command"
      }
    }
    finally {
      Pop-Location
    }
  }
}

Write-Host 'All active package checks passed.'
