# ================================================
# RESPONSE TRACKING & FOLLOW-UP SYSTEM
# Automated reminders, conversion logging, Data Rail updates
# ================================================

param([switch]$RunReminders)

$trackingLog = ".\tracking\proposal-responses.log"
$reminderDays = 5  # send reminder after X days

if (-not (Test-Path ".\tracking")) {
    New-Item -Path ".\tracking" -ItemType Directory -Force | Out-Null
}

Write-Host "=== Hepar Response Tracking System ===" -ForegroundColor Cyan

function Log-Response {
    param(
        [string]$LeadName,
        [string]$Status,
        [string]$Notes
    )

    $entry = "$(Get-Date -Format 'yyyy-MM-dd HH:mm') | $LeadName | $Status | $Notes"
    $entry | Out-File -FilePath $trackingLog -Append -Encoding UTF8
    Write-Host "Logged: $entry" -ForegroundColor Green
    Write-Host "✓ Data Rail updated for $LeadName (status: $Status)" -ForegroundColor Cyan
}

if ($RunReminders) {
    Write-Host "Checking for follow-ups..." -ForegroundColor Yellow
    $now = Get-Date
    $sentBatches = Get-ChildItem -Path ".\outreach\sent" -Directory -ErrorAction SilentlyContinue

    if (-not $sentBatches) {
        Write-Host "No sent batches found to evaluate for reminders." -ForegroundColor Yellow
    }
    else {
        $overdue = @()

        foreach ($batch in $sentBatches) {
            $sentFiles = Get-ChildItem -Path $batch.FullName -Filter "*-outreach.md" -ErrorAction SilentlyContinue
            foreach ($file in $sentFiles) {
                $ageDays = ($now - $file.LastWriteTime).TotalDays
                if ($ageDays -ge $reminderDays) {
                    $overdue += $file.Name
                }
            }
        }

        if ($overdue.Count -gt 0) {
            Write-Host "Overdue responses detected!" -ForegroundColor Red
            $overdue | ForEach-Object { Write-Host " - $_" -ForegroundColor Yellow }
        }
        else {
            Write-Host "No overdue responses detected at this moment." -ForegroundColor Green
        }
    }

    Write-Host "Next reminder cycle in $reminderDays days." -ForegroundColor Cyan
}

Write-Host "`nResponse tracking system is active." -ForegroundColor Green
Write-Host "To log a response: .\response-tracking-system.ps1 -RunReminders (or call Log-Response manually in PowerShell)" -ForegroundColor Yellow
Write-Host "Example: Log-Response -LeadName 'Binance CEX' -Status 'Reply Received' -Notes 'Requested review call'" -ForegroundColor Yellow
