# ================================================
# SOVEREIGN MONAD COMMAND HUB MONITOR
# Version 1.0 - Operational Dashboard
# Tracks Engagement Status, Sector Penetration, and Follow-up Triggers
# ================================================

Write-Host '=== Sovereign Monad Command Hub Dashboard (v1.0) ===' -ForegroundColor Cyan
Write-Host "Local Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm')" -ForegroundColor White

$logPath = ".\outreach\dispatch-log.csv"
$crmPath = ".\outreach\CRM-Sovereign-Monad.csv"

if (-not (Test-Path $logPath)) {
    Write-Host "No active dispatches found. Command Hub is idle." -ForegroundColor Yellow
    exit
}

# 1. Initialize CRM if missing
if (-not (Test-Path $crmPath)) {
    "Lead,Sector,Status,LastContact,NextAction" | Out-File $crmPath -Encoding utf8
}

$dispatches = Import-Csv $logPath
$totalLeads = $dispatches.Count

# 2. Sector Breakdown
$sectors = @{ "Exchange" = 0; "Liquidity" = 0; "Lending" = 0; "Infrastructure" = 0; "Yield" = 0; "Other" = 0 }
foreach ($d in $dispatches) {
    # Simple sector inference from batch name or lead name if not in log (v1.0)
    if ($d.Lead -match "Binance|Bybit|OKX") { $sectors["Exchange"]++ }
    elseif ($d.Lead -match "Uniswap|Curve|Pancake|Lido") { $sectors["Liquidity"]++ }
    elseif ($d.Lead -match "Spark|Centrifuge") { $sectors["Lending"]++ }
    elseif ($d.Lead -match "SSV") { $sectors["Infrastructure"]++ }
    elseif ($d.Lead -match "Falcon") { $sectors["Yield"]++ }
    else { $sectors["Other"]++ }
}

Write-Host "`n--- Pipeline Summary ---" -ForegroundColor Green
Write-Host "Total Institutional Leads Engaged: $totalLeads"
Write-Host "Exchanges:      $($sectors['Exchange'])"
Write-Host "Liquidity Hubs: $($sectors['Liquidity'])"
Write-Host "Lending/Yield:  $($sectors['Lending'] + $sectors['Yield'])"
Write-Host "Infrastructure: $($sectors['Infrastructure'])"

# 3. Follow-up Intelligence (7-day threshold)
Write-Host "`n--- Follow-up Intelligence ---" -ForegroundColor Cyan
$followupCount = 0
foreach ($d in $dispatches) {
    $dispatchDate = [DateTime]::ParseExact($d.Timestamp, "yyyy-MM-dd HH:mm", $null)
    $daysOld = ((Get-Date) - $dispatchDate).TotalDays
    
    if ($daysOld -gt 7) {
        Write-Host "[!] FOLLOW-UP DUE: $($d.Lead) ($($daysOld -as [int]) days since dispatch)" -ForegroundColor Red
        $followupCount++
    }
}

if ($followupCount -eq 0) {
    Write-Host "All leads are within the active response window. No follow-ups due." -ForegroundColor Green
}

# 4. Recent Activity
Write-Host "`n--- Recent Dispatches (Latest 5) ---" -ForegroundColor White
$dispatches | Select-Object -Last 5 | Format-Table -AutoSize

Write-Host "`n=== MONITORING COMPLETE ===" -ForegroundColor Cyan
Write-Host "To update a lead status, edit: $crmPath" -ForegroundColor Yellow
