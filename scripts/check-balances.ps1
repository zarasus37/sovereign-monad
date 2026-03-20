[CmdletBinding()]
param(
    [string]$WalletAddress
)

. (Join-Path $PSScriptRoot 'common.ps1')

$envMap = Get-ActiveEnvMap

if (-not $WalletAddress) {
    $WalletAddress = $envMap['WALLET_ADDRESS']
}

if (-not (Test-HexAddress $WalletAddress)) {
    Write-Warning 'A valid 0x-prefixed 40-byte wallet address is required. Set WALLET_ADDRESS in .env or pass -WalletAddress.'
    exit 1
}

$checks = @(
    @{ Name = 'Base'; Rpc = $envMap['BASE_RPC_URL'] },
    @{ Name = 'Arbitrum'; Rpc = $envMap['ARBITRUM_RPC_URL'] }
)

$rows = foreach ($check in $checks) {
    if (-not $check.Rpc) {
        [pscustomobject]@{
            Chain = $check.Name
            RpcUrl = '(missing)'
            BalanceEth = $null
            Status = 'Missing RPC URL'
        }
        continue
    }

    try {
        $response = Invoke-EvmJsonRpc -RpcUrl $check.Rpc -Method 'eth_getBalance' -Params @($WalletAddress, 'latest')
        $eth = Convert-HexWeiToEth -HexValue $response.result
        [pscustomobject]@{
            Chain = $check.Name
            RpcUrl = $check.Rpc
            BalanceEth = [math]::Round($eth, 8)
            Status = 'OK'
        }
    }
    catch {
        [pscustomobject]@{
            Chain = $check.Name
            RpcUrl = $check.Rpc
            BalanceEth = $null
            Status = $_.Exception.Message
        }
    }
}

Write-Host "Wallet balances for $WalletAddress"
$rows | Format-Table -AutoSize