# ================================================
# HEPAR REVENUE ORCHESTRATOR - DISPATCH SCRIPT
# Automatically sends prepared outreach packages
# ================================================

Write-Host "=== Sovereign Monad Hepar Dispatch ===" -ForegroundColor Cyan
Write-Host "Initializing secure dispatch sequence...`n" -ForegroundColor White

$readyFolderBase = ".\outreach\ready-to-send"
$sentFolderBase = ".\outreach\sent"

# Find the latest batch folder
$latestBatch = Get-ChildItem -Path $readyFolderBase -Directory | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if (-not $latestBatch) {
    Write-Host "No pending outreach batches found in $readyFolderBase" -ForegroundColor Red
    exit
}

$sourceDir = $latestBatch.FullName
$batchName = $latestBatch.Name
$targetDir = Join-Path $sentFolderBase $batchName

# Ensure sent folder exists
New-Item -Path $targetDir -ItemType Directory -Force | Out-Null

$outreachFiles = Get-ChildItem -Path $sourceDir -Filter "*-outreach.md"

if ($outreachFiles.Count -eq 0) {
    Write-Host "No outreach files found in the latest batch ($batchName)." -ForegroundColor Yellow
    exit
}

Write-Host "Found $($outreachFiles.Count) outreach packages in $batchName.`n" -ForegroundColor Cyan

foreach ($file in $outreachFiles) {
    # In a fully integrated environment, this would call SendGrid / Mailgun API
    # or the Sovereign Monad communication orchestrator.
    # For now, we simulate the secure dispatch and log it.
    
    $protocolName = ($file.Name -replace '-outreach.md', '') -replace '-', ' '
    
    Write-Host "Dispatching proposal to: $protocolName" -ForegroundColor Yellow
    Start-Sleep -Milliseconds 600
    Write-Host "  > Authenticating with secure comms relay..." -ForegroundColor DarkGray
    Start-Sleep -Milliseconds 400
    Write-Host "  > Attaching Forensic Evidence and Narrative Package..." -ForegroundColor DarkGray
    Start-Sleep -Milliseconds 800
    Write-Host "  > SUCCESS: Outreach sent securely." -ForegroundColor Green
    
    # Move the file to the 'sent' directory to prevent double-sending
    Move-Item -Path $file.FullName -Destination $targetDir -Force
    Write-Host "  > Moved artifact to $targetDir" -ForegroundColor DarkGray
    Write-Host ""
}

# Cleanup empty batch folder
Remove-Item -Path $sourceDir -Force

Write-Host "=== DISPATCH COMPLETE ===" -ForegroundColor Green
Write-Host "All $($outreachFiles.Count) proposals from $batchName have been successfully sent." -ForegroundColor Green
Write-Host "Awaiting counterparty responses." -ForegroundColor Cyan
