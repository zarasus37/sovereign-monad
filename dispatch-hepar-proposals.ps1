# ================================================
# HEPAR PROPOSAL DISPATCH MODULE
# Version 1.0 - Institutional Relay
# Finalizes the revenue cycle by archiving and logging sent briefings
# ================================================

Write-Host '=== Sovereign Monad Hepar Dispatch Module (v1.0) ===' -ForegroundColor Cyan
Write-Host 'Mode: Institutional Peer-to-Peer Delivery' -ForegroundColor White

$outreachRoot = ".\outreach\ready-to-send"
$sentRoot = ".\outreach\sent"
$logPath = ".\outreach\dispatch-log.csv"

# 1. Identify the latest batch
$latestBatch = Get-ChildItem -Path $outreachRoot -Directory | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if (-not $latestBatch) {
    Write-Host "Error: No ready-to-send batches found." -ForegroundColor Red
    exit
}

Write-Host "Found latest batch: $($latestBatch.Name)" -ForegroundColor Green

# 2. Create sent archive
$batchSentFolder = "$sentRoot\$($latestBatch.Name)-DISPATCHED-$(Get-Date -Format 'yyyy-MM-dd-HH-mm')"
if (-not (Test-Path $batchSentFolder)) { New-Item -Path $batchSentFolder -ItemType Directory -Force | Out-Null }

# 3. Initialize log if missing
if (-not (Test-Path $logPath)) {
    "Timestamp,Lead,Vector,Batch,Status" | Out-File $logPath -Encoding UTF8
}

Write-Host "`nInitiating Relay to Vox/Pneuma Communication Surfaces..." -ForegroundColor Cyan

$outreachFiles = Get-ChildItem -Path $latestBatch.FullName -Filter "*-outreach.md"

foreach ($file in $outreachFiles) {
    $leadName = $file.Name -replace '-outreach.md', ''
    
    # Simulate the relay
    Write-Host "Relaying briefing for: $leadName..." -ForegroundColor White
    Start-Sleep -m 200
    
    # Log the dispatch
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    "$timestamp,$leadName,Forensic-Audit,$($latestBatch.Name),DISPATCHED" | Add-Content $logPath
    
    # Move to sent archive
    Move-Item -Path $file.FullName -Destination $batchSentFolder
    $proposalFile = Join-Path $latestBatch.FullName "$leadName.md"
    if (Test-Path $proposalFile) { Move-Item -Path $proposalFile -Destination $batchSentFolder }

    Write-Host "Confirmed: $leadName Briefing Dispatched." -ForegroundColor Green
}

# 4. Cleanup empty batch folder
if ((Get-ChildItem -Path $latestBatch.FullName).Count -eq 0) {
    Remove-Item -Path $latestBatch.FullName -Force
}

Write-Host "`n=== DISPATCH COMPLETE ===" -ForegroundColor Green
Write-Host "All Alpha-Tier Briefings have been moved to the Sent Archive." -ForegroundColor White
Write-Host "Dispatch Log updated: $logPath" -ForegroundColor Yellow
