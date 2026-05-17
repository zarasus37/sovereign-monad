# Mainnet Revenue Router Proof

Last updated: 2026-04-21

## Status

Step 1 is already complete at the contract-deployment level.

`RevenueRouter.sol` is deployed on Monad chain `143` as part of the Phase 1a deployment completed on `2026-04-18`.

## Primary Contract

| Item | Value |
|---|---|
| Network | Monad mainnet / chain `143` |
| Deployment report | `deployments/phase1a-deploy-phase1a.json` |
| Proof report | `deployments/phase1a-mainnet-proof.json` |
| Deployer | `0x54D928b0593db01BB46b2A5D0c2e4365C6Ac881F` |
| RevenueRouter | `0x39158bC2cfCa2cCF70121EF72ed9a5fF1e084982` |
| RevenueRouter creation tx | `0x78bc936c000d555d2714462e6f2a7aef5cc9d32e3ea7fbb2ff876e529f51fdfe` |
| RevenueRouter explorer URL | `https://monadscan.com/tx/0x78bc936c000d555d2714462e6f2a7aef5cc9d32e3ea7fbb2ff876e529f51fdfe` |
| RevenueRouter deployment block | `69021947` |
| Router create nonce | `40` |
| Router runtime bytecode | present, `6546` bytes |
| Approved bootstrap source | `0x9d4fcf7E0Ae5AE994A6eb0bCCbDfAA62E5867352` |

## Contract Creation Transactions

| Contract | Address | Creation tx |
|---|---|---|
| DoveCore | `0x550675701B7359C4F81C79A376cC87b9439c40c1` | `0xa6e1719fb856634ac10db96a96b04d373c6c3ab66fb540e9727fb9a9fa82cdfa` |
| GovernanceController | `0x5BAF977F3EdfB783C904E82B68Fd476C236635Ae` | `0x37ba98fe6d539bedd63900e2b1ac68780cd65ddccb16f8255c1267c2d1921305` |
| InboundReceiver | `0x9CEC40c3F7f758bB40aF761a5024A6B007115055` | `0x68dd24a754f80b04999f697d5690d01eda7922f2f7667ec957d3628e982dd8ba` |
| RevenueSinkTreasury | `0xA36F3dABDda3CF0AC21C9b3326115808cA5EEA7C` | `0x79ebfda3a949dbd4e04c671cae1746e885f9093c667016a90dbb8a3101b28c0d` |
| RevenueSinkMEV | `0xfB556b6f93c9C5c703e2C121B03b23CBD43E666B` | `0xff3c57f53188b440e2b5c7a05de0cd70f08d11d4c12ad448e0c7d4652486b177` |
| RevenueSinkOpsDev | `0x64771e57A0E36277e700c8b69Adc09Db4dcA02Fa` | `0x4a445eb22455c3224a72723ddd7f76370cd3564a729cb244e0202b7400f5fb9c` |
| RevenueSinkDataYield | `0x39A6EeeD870dBa53BC23fEeCdFf96aB793BC613B` | `0x772745af4f820d63d65ba09a552f470c734741ee4481b9d9f8d4f72e985036e7` |
| RevenueSinkFounder | `0x6047c904AE3804a624298084df2C4b32b516Ac71` | `0x9aa6f951c65073c62d56d711c2a7426c9c62dff4ceeb1befd44ba67157f94ef7` |
| RevenueSinkDelegatePools | `0xE8bb66369832C7205b60F845EAe13E5d4fc78479` | `0x206e922d4be2de96673c29cd76ba9f573c75c6873459f851ff9b6d8c4c2e980f` |
| RevenueRouter | `0x39158bC2cfCa2cCF70121EF72ed9a5fF1e084982` | `0x78bc936c000d555d2714462e6f2a7aef5cc9d32e3ea7fbb2ff876e529f51fdfe` |
| DoveRouterObserver | `0xbb588A64C82a4a13f866B59c0b6B69DD910504a1` | `0x4dc7f0f2a99b865ffe5424e9d55d48bedc69634ff43af5a914370f660b700ff1` |

## Verification Run

Command:

```powershell
cmd /c npm run verify:phase1a
```

Result:

- receiver/router linked
- router/receiver linked
- DataYield/MEV linked
- observer initialized
- sink registry linked
- approved source registered
- Dove observer count: `11`

Contract test suite:

```powershell
cmd /c npm run test:contracts
```

Result:

- `14 passing`

Proof report:

```powershell
cmd /c npm run proof:phase1a
```

Result:

- status: `verified`
- chain ID: `143`
- router creation tx resolved successfully
- all 11 recorded contract-creation receipts matched their deployed addresses

## Current Blockers / Gaps

These do not invalidate the deployed router, but they matter for external review:

1. The deployer balance is currently below the repo's fresh-deploy preflight minimum.
   - Current balance from RPC: `0.000735 MON`
   - Fresh deployment minimum in config: `1 MON`
   - Meaning: do not attempt a duplicate redeploy without refilling the deployer.

2. Source verification still needs to be completed on the public explorer.
   - `RevenueRouter` is currently visible as an unverified contract on MonadScan.
   - Do not alter deployed source files casually before explorer verification; exact source/compiler settings matter.

3. The deployed Phase 1a allocation policy is:
   - `40%` Treasury
   - `25%` MEV
   - `15%` Ops/Dev
   - `10%` DataYield
   - `5%` DelegatePools
   - `5%` Founder

   This does not match wording that describes `10% Marketing / 5% Reserve / 5% Liquidity`. Public pitch copy should match the deployed contract or explicitly describe any future allocation revision as not yet deployed.

4. The source metadata comments in the deployed contract files still say `Deployment Status: not deployed`.
   - That comment is stale relative to the live Phase 1a report.
   - It is not a runtime blocker.
   - Keep exact deployed source intact until source verification is complete; use this proof file and public docs to communicate live status.

## Recommendation

Do not redeploy `RevenueRouter.sol` as the next action unless the intent is to intentionally create a new router version.

The better Step 1 closeout is:

1. publish this deployment proof
2. complete explorer source verification
3. correct stale docs wording without breaking exact-source verification
4. continue to Step 2 public website using the live router address above
