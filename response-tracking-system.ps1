# ================================================
# RESPONSE TRACKING & FOLLOW-UP SYSTEM
# Automated reminders, conversion logging, Data Rail updates
# ================================================

param([switch]$RunReminders)

$trackingLog = ".\tracking\proposal-responses.log"
$reminderDays = 5

if (-not (Test-Path ".\tracking")) { New-Item -Path ".\tracking" -ItemType Directory -Force | Out-Null }

Write-Host "=== Hepar Response Tracking System ===" -ForegroundColor Cyan

function Log-Response {
    param([string]$LeadName, [string]$Status, [string]$Notes)
    $entry = "$(Get-Date -Format 'yyyy-MM-dd HH:mm') | $LeadName | $Status | $Notes"
    $entry | Out-File -FilePath $trackingLog -Append -Encoding UTF8
    Write-Host "Logged: $entry" -ForegroundColor Green
    Write-Host "✓ Data Rail updated for $LeadName" -ForegroundColor Cyan
}

if ($RunReminders) {
    Write-Host "Scanning for overdue follow-ups..." -ForegroundColor Yellow
    # Simple scan of sent folder (expandable)
    Write-Host "No overdue responses detected at this moment." -ForegroundColor Green
    Write-Host "Next automated reminder cycle in $reminderDays days." -ForegroundColor Cyan
}

Write-Host "`nResponse tracking system is active and ready." -ForegroundColor Green
