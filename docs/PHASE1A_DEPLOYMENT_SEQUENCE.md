# Phase 1a Deployment Sequence

This document is the executable deployment/rehearsal companion to the locked Phase 1a order in the MOF.

## Canonical Source

The order remains governed by:

- `docs/sovereign_monad_MOF_v2.3.0.md`

## Implemented Sequence

The implemented runner executes these steps in order:

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
20. Wire stipend / treasury references
21. Register initial approved source

## Step 21 Truthful Current Interpretation

If the Stake-linked MonadSpin source is not yet deployed, Step 21 must use a bootstrap source address you control.

Rule:

- use the real Stake-linked source once it exists
- until then, register a temporary bootstrap source and document it explicitly
- do not describe the approved source as MonadSpin if the Stake-linked source does not yet exist

## Current Executable Interpretation Of Step 20

The reconstructed Phase 1a contracts do not currently expose a separate treasury-reference setter.

So the executable Step 20 currently means:

- `RevenueSinkDataYield.setMevSink(...)`
- `RevenueSinkMEV.setDataYieldSource(...)`

That is the present honest executable subset. If later reconstructed or recovered contracts introduce dedicated treasury/stipend reference setters, Step 20 should be expanded to include them.

## Commands

Preflight the live deployment inputs:

```bash
npm run preflight:phase1a
```

Compile:

```bash
npm run build:contracts
```

Run the deployment sequence locally:

```bash
npm run deploy:phase1a
```

Run the deployment sequence against the configured `phase1a` network:

```bash
npx hardhat run scripts/deploy-phase1a.js --network phase1a
```

Run the deployment rehearsal with a test inflow and allocation assertions:

```bash
npm run rehearse:phase1a
```

Verify a live deployment from the saved report:

```bash
npm run verify:phase1a
```

## Output

Both commands write a JSON report to:

- `deployments/phase1a-deploy-<network>.json`
- `deployments/phase1a-rehearsal-<network>.json`

These reports are local deployment artifacts. They do not mean Phase 1a is live onchain.

## Live Deployment Inputs

Live deployment prep now expects:

- `.env.phase1a` or shell env vars for RPC and deployer key
- `config/phase1a.deploy.json` for founder and approved-source addresses

For `approvedSourceAddress`:

- if Stake/MonadSpin is live, use that real revenue address
- if Stake/MonadSpin is not live, use a bootstrap source address you control and label it as temporary
- explicit preflight acknowledgments for:
  - confirmed deployer address
  - fresh deployer wallet with zero tx history
  - founder address matching deployer, if intentional

Reference files:

- `.env.phase1a.example`
- `config/phase1a.deploy.example.json`

## Funding Guidance

Use two separate balance concepts:

- hard fail floor: `minDeployerBalanceNative`
- recommended live deploy budget: `recommendedDeployerBalanceNative`

Current practical guidance for Monad mainnet:

- minimum floor: `1 MON`
- recommended deploy funding: `10 MON`

The minimum exists to catch obviously underfunded wallets. The recommended budget exists because the full Phase 1a deployment sequence is many transactions deep and can drain a lightly funded wallet before completion.

## Preflight Hard Stops

The preflight now fails closed on:

- RPC `eth_chainId` not matching the expected chain ID
- invalid or placeholder `approvedSourceAddress`
- deployer balance below the configured native-token gas floor (`minDeployerBalanceNative`, denominated in MON on Monad mainnet)
- `.env.phase1a` or `config/phase1a.deploy.json` being tracked or staged in git
- missing manual deployer confirmation

The preflight also requires explicit acknowledgment when:

- the deployer address has zero prior transaction history on the target chain
- the founder address matches the deployer address

The preflight also warns when:

- deployer balance is below `recommendedDeployerBalanceNative` even if it is still above the hard fail floor
