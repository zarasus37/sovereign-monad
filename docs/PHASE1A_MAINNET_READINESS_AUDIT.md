# Phase 1a Mainnet Readiness Audit

Last updated: 2026-04-21

## Executive Result

Phase 1a is mainnet-deployed on Monad chain `143`; `RevenueRouter.sol` does not require a duplicate deployment for Step 1.

Primary router:

- address: `0x39158bC2cfCa2cCF70121EF72ed9a5fF1e084982`
- creation tx: `0x78bc936c000d555d2714462e6f2a7aef5cc9d32e3ea7fbb2ff876e529f51fdfe`
- explorer: `https://monadscan.com/tx/0x78bc936c000d555d2714462e6f2a7aef5cc9d32e3ea7fbb2ff876e529f51fdfe`
- deployment block: `69021947`
- deployer: `0x54D928b0593db01BB46b2A5D0c2e4365C6Ac881F`

## Scope Reviewed

Contracts reviewed:

1. `DoveCore.sol`
2. `GovernanceController.sol`
3. `InboundReceiver.sol`
4. `RevenueRouter.sol`
5. `RevenueSinkTreasury.sol`
6. `RevenueSinkMEV.sol`
7. `RevenueSinkOpsDev.sol`
8. `RevenueSinkDataYield.sol`
9. `RevenueSinkFounder.sol`
10. `RevenueSinkDelegatePools.sol`
11. `DoveRouterObserver.sol`

Deployment/config reviewed:

- `hardhat.config.js`
- `config/phase1a.deploy.json`
- `scripts/deploy-phase1a.js`
- `scripts/phase1a-sequence.js`
- `scripts/preflight-phase1a.js`
- `scripts/verify-phase1a.js`
- `deployments/phase1a-deploy-phase1a.json`

## Mainnet Configuration

Current mainnet deployment inputs are aligned to Monad mainnet:

- `PHASE1A_RPC_URL=https://rpc.monad.xyz`
- `PHASE1A_CHAIN_ID=143`
- `config/phase1a.deploy.json.expectedChainId=143`
- `approvedSourceAddress=0x9d4fcf7E0Ae5AE994A6eb0bCCbDfAA62E5867352`
- `founderAddress=0xD86Ed529AB21D84eFF8Fe13261eaeC589BA9Ae66`

No hardcoded Monad testnet chain ID `10143` was found in the Phase 1a contracts, deployment scripts, or active mainnet config.

Gas behavior:

- default: provider-estimated gas and gas price through Hardhat
- optional override: `PHASE1A_GAS_LIMIT`
- optional override: `PHASE1A_GAS_PRICE_WEI`

## Deployment Order

The implemented live sequence is:

1. Deploy `DoveCore.sol`
2. Deploy `GovernanceController.sol(doveCore)`
3. Register `GovernanceController` as observer
4. Deploy `InboundReceiver.sol`
5. Register `InboundReceiver` as observer
6. Deploy `RevenueSinkTreasury.sol`
7. Deploy `RevenueSinkMEV.sol`
8. Deploy `RevenueSinkOpsDev.sol`
9. Deploy `RevenueSinkDataYield.sol`
10. Deploy `RevenueSinkFounder.sol`
11. Deploy `RevenueSinkDelegatePools.sol`
12. Deploy `RevenueRouter.sol`
13. Register router and sinks as observers
14. Initialize router sinks
15. Set receiver on router
16. Set router / receiver addresses across system
17. Deploy `DoveRouterObserver.sol`
18. Register `DoveRouterObserver`
19. Initialize `DoveRouterObserver` with system addresses
20. Wire DataYield to MEV redirection
21. Register initial approved bootstrap source

## Fresh Deployment Commands

Use these only if intentionally deploying a new Phase 1a instance. The existing router is already live.

```powershell
cd C:\Users\crisc\Dev\agents\sovereign-monad
cmd /c npm ci
cmd /c npm run build:contracts
cmd /c npm run test:contracts
cmd /c npm run preflight:phase1a
cmd /c npm run deploy:phase1a
cmd /c npm run verify:phase1a
cmd /c npm run proof:phase1a
```

Optional gas override example:

```powershell
$env:PHASE1A_GAS_LIMIT="3500000"
$env:PHASE1A_GAS_PRICE_WEI="108000000000"
cmd /c npm run deploy:phase1a
```

## Existing Deployment Verification Commands

Use these for the current live deployment:

```powershell
cd C:\Users\crisc\Dev\agents\sovereign-monad
cmd /c npm run verify:phase1a
cmd /c npm run proof:phase1a
```

Expected results:

- receiver/router link passes
- router/receiver link passes
- DataYield/MEV link passes
- observer initialized
- sink registry linked
- bootstrap approved source registered
- Dove observer count is `11`
- all recorded creation txs resolve to successful contract-creation receipts

## Current Blockers

These are not blockers to proving the existing router, but they block a clean fresh redeploy:

1. The deployer balance is below the configured fresh-deploy floor.
2. Explorer source verification is not complete.
3. Public pitch material must describe the deployed allocation policy accurately.

Deployed allocation policy:

- `40%` Treasury
- `25%` MEV
- `15%` Ops/Dev
- `10%` DataYield
- `5%` DelegatePools
- `5%` Founder

Do not describe the deployed router as using `10% Marketing / 5% Reserve / 5% Liquidity` unless a later router revision implements that distribution.

## Auditor-Facing Concerns

Likely auditor findings to address or document:

1. Governance centralization: `GovernanceController` owner/executors can execute broad system calls.
2. No timelock/multisig enforcement exists in the deployed Phase 1a governance surface.
3. Founder sink withdrawal authority exists and should be paired with governance pause/operational policy.
4. Router routing is atomic; a reverting sink blocks the whole distribution.
5. DataYield redirects into the MEV sink before Phase 3; this is intentional but should be documented as pre-Phase-3 behavior.
6. `InboundReceiver.receiveMonadSpinRevenue()` retains legacy naming; public GameFi routing should prefer `receiveApprovedInflow(...)` until a future ABI revision removes the stale name.
7. Contract source comments still say `Deployment Status: not deployed`; avoid changing exact deployed source until explorer source verification is complete.

## Step 1 Closeout

Step 1 should be considered complete when:

- `cmd /c npm run verify:phase1a` passes
- `cmd /c npm run proof:phase1a` passes
- `docs/MAINNET_REVENUE_ROUTER_PROOF.md` is published or linked from public materials
- explorer source verification is queued as the next audit/public credibility task
