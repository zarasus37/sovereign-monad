@echo off
REM Sovereign Arb Scout - Runner
REM Paste your Dune API key below.
REM Optional:
REM   1. copy wallet_labels.example.json to wallet_labels.json for manual labels
REM   2. set SCOUT_PRESALE_URL to your public landing page before outbound

set DUNE_KEY=n2Nszy1ReGgouxvZy1koOI0dpG1mPPpe
set SCOUT_PRESALE_URL=

python scout.py --dune-key %DUNE_KEY% --limit 15 --output reports.json

echo.
echo Done. Open reports.json to see all evaluations.
pause
