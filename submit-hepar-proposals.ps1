# ================================================
# Hepar Proposal Submission Script
# Sends hand-tailored proposals via Pneuma/Vox outreach surfaces
# ================================================

param(
    [string]$Batch = "first-batch-comprehensive",
    [string]$Channel = "primary"
)

$proposalsFolder = ".\proposals\$Batch"
$outreachFolder = ".\outreach\ready-to-send\$Batch"

if (-not (Test-Path $proposalsFolder)) {
    Write-Host "Error: Proposals folder not found: $proposalsFolder" -ForegroundColor Red
    exit
}

if (-not (Test-Path $outreachFolder)) {
    New-Item -Path $outreachFolder -ItemType Directory -Force | Out-Null
    Write-Host "Created outreach folder: $outreachFolder" -ForegroundColor Green
}

$proposalFiles = Get-ChildItem -Path $proposalsFolder -Filter "*.md"

if ($proposalFiles.Count -eq 0) {
    Write-Host "No proposal files found in $proposalsFolder" -ForegroundColor Yellow
    exit
}

Write-Host "Found $($proposalFiles.Count) proposals to prepare for outreach..." -ForegroundColor Cyan

foreach ($file in $proposalFiles) {
    $leadName = $file.BaseName -replace '-', ' '
    $content = Get-Content $file.FullName -Raw
    
    $emailSubject = "Hepar Institutional Risk Intelligence Suite - Proposal for $leadName"
    
    $emailBody = @"
Dear $leadName Team,

I hope this message finds you well.

We have completed a full Hepar v2.0 forensic analysis and six-organ consensus review of your protocol. The attached proposal contains:

• Deep forensic risk findings with full evidence
• Strategic scenarios and recommendations (Cortex)
• Adaptive routing and urgency analysis (Synapse)
• Execution feasibility and cost metrics (Pneuma)
• Allocation guidance (Cardia)
• Multi-audience narrative packages (Vox)

This is a comprehensive Institutional Continuous Risk Intelligence Suite designed to provide ongoing protection and strategic clarity.

**Pricing Summary** (3-month minimum):
- One-time setup & deep forensic report: `$45,000
- Monthly continuous monitoring & risk feed: `$18,000

Full proposal is attached as a Markdown file with all evidence links.

Would you be available for a brief review call next week to discuss implementation and onboarding?

Best regards,  
Cris Colon  
Founder, Sovereign Monad  
Agent 0 - Genesis Entry
"@
    
    $outreachFile = "$outreachFolder\$($file.BaseName)-outreach.md"
    
    @"
**OUTREACH PACKAGE - $leadName**
**Channel**: $Channel
**Subject**: $emailSubject

---

$emailBody

---

**Attached Proposal**: $($file.Name)
**Full Evidence**: Available in Data Rail
**Status**: Ready to send
"@ | Out-File -FilePath $outreachFile -Encoding UTF8

    Write-Host "Prepared outreach for: $leadName" -ForegroundColor Green
}

Write-Host "`nAll outreach packages have been prepared successfully!" -ForegroundColor Green
Write-Host "Location: $outreachFolder" -ForegroundColor Green
Write-Host "`nReview the files in the outreach folder, then reply with 'SEND' if you want me to provide the final sending script."
Write-Host "This keeps full human oversight on actual external communication." -ForegroundColor Yellow
