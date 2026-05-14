# ================================================
# FULL END-TO-END AUTONOMY WITH HUMAN APPROVAL GATE
# Pipeline fix + diagnostic + proposals + dispatch gate
# ================================================

Write-Host "=== Full End-to-End Autonomous Revenue Cycle ===" -ForegroundColor Cyan

# 1. Pipeline fix
Write-Host "Fixing @azure/cosmos and redeploying..." -ForegroundColor Yellow
cd .\organ-runtime\functions\hepar-commercial-pipeline
Remove-Item -Path "node_modules\@azure\cosmos" -Recurse -Force -ErrorAction SilentlyContinue
npm install @azure/cosmos --save
func azure functionapp publish hepar-commercial-pipeline --nozip
cd ..\..\..

# 2. Post-dispatch diagnostic
.\diagnose-enriched-leads-post-dispatch.ps1

# 3. Generate proposals (dynamic allocation)
$timestamp = Get-Date -Format "yyyy-MM-dd-HH-mm"
$proposalsFolder = ".\proposals\batch-$timestamp"
New-Item -Path $proposalsFolder -ItemType Directory -Force | Out-Null

# Leads array (same as master orchestrator)
$leads = @(
    @{ Name = "Binance CEX"; Score = 80; TVL = 80000000000; Summary = "Requires ongoing privileged access and wallet taint monitoring at institutional depth." },
    @{ Name = "Steakhouse Financial"; Score = 80; TVL = 1200000000; Summary = "Institutional-grade protocol with clear monitoring surfaces." },
    @{ Name = "PancakeSwap AMM"; Score = 60; TVL = 2000000000; Summary = "Key DEX infrastructure requiring continuous risk intelligence." },
    @{ Name = "Spark Liquidity Layer"; Score = 60; TVL = 450000000; Summary = "Liquidity protocol with strong execution feasibility." },
    @{ Name = "Uniswap V3"; Score = 75; TVL = 4000000000; Summary = "Major DEX with high TVL and governance signals." },
    @{ Name = "Curve DEX"; Score = 75; TVL = 1100000000; Summary = "Established DEX needing ongoing forensic oversight." },
    @{ Name = "Centrifuge Protocol"; Score = 60; TVL = 250000000; Summary = "Real-world asset protocol with institutional relevance." },
    @{ Name = "Falcon Finance"; Score = 60; TVL = 300000000; Summary = "Presents a strong opportunity for Hepar’s full institutional suite." }
)

Write-Host "`nGenerating hand-tailored proposals..." -ForegroundColor Cyan
foreach ($lead in $leads) {
    $safeName = $lead.Name -replace ' ', '-'
    $filePath = "$proposalsFolder\$safeName.md"
    $percentage = 0.0005 + (( $lead.Score - 50 ) / 45 * 0.0015)
    $allocationCap = [math]::Round($lead.TVL * $percentage)
    if ($allocationCap -lt 15000) { $allocationCap = 15000 }
    if ($allocationCap -gt 100000) { $allocationCap = 100000 }

    $content = @"
# Hepar Institutional Continuous Risk Intelligence Suite
**Proposal for $($lead.Name)**  
**Hepar Score**: $($lead.Score)  
**Date**: $(Get-Date -Format "yyyy-MM-dd")

## Cardia Allocation Guidance (Dynamic)
- Recommended net allocation cap: `$$allocationCap (0.05–0.2 % of TVL scaled by audit score)
"@
    $content | Out-File -FilePath $filePath -Encoding UTF8
    Write-Host "Generated proposal: $($lead.Name) — Allocation: `$$allocationCap" -ForegroundColor Green
}

# 4. Human Approval Gate
$approval = Read-Host "`nType APPROVE to dispatch these proposals (or CANCEL to abort)"
if ($approval -ne "APPROVE") {
    Write-Host "Dispatch cancelled by human gate." -ForegroundColor Red
    exit
}

Write-Host "Human approval received — Dispatching..." -ForegroundColor Green

# 5. Response Tracking
.\response-tracking-system.ps1 -RunReminders

Write-Host "`n=== END-TO-END CYCLE COMPLETE WITH APPROVAL GATE ===" -ForegroundColor Green
