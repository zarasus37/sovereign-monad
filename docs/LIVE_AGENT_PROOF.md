# Live Agent Behavioral Loop Proof

Last updated: 2026-04-23

## Status

Step 6 is complete. Agent 0 is registered on Monad mainnet and one live behavioral decision has been recorded on-chain through `EmergenceRecorder`.

Mainnet proof:

- deployer: `0x54D928b0593db01BB46b2A5D0c2e4365C6Ac881F`
- `EmergenceRecorder`: `0x6692a350f4b74Ae6855E633aD99eEC1cf80e5d84`
- deployment tx: `0x53a88c32a397c49a535e65de94a5ce2579bfc0f89207e93688cfe2621d446d67`
- Agent 0 registration tx: `0xf68419e554a2afa0b30ab78e65671e13b388da1f00ddc77638f262886aeb9ced`
- `recordClaim` tx: `0x70f14e03934e15b1c51a99a8f82cf75764c42807468a56e9e01889b093154fef`

No funds were moved during the behavioral proof. The on-chain write records the decision hash and its routing context only.

## Live Phase 1a Anchor

- `RevenueRouter`: `0x39158bC2cfCa2cCF70121EF72ed9a5fF1e084982`
- chain: Monad mainnet `143`
- creation tx: `0x78bc936c000d555d2714462e6f2a7aef5cc9d32e3ea7fbb2ff876e529f51fdfe`
- explorer: `https://monadscan.com/tx/0x78bc936c000d555d2714462e6f2a7aef5cc9d32e3ea7fbb2ff876e529f51fdfe`

## Agent Profile

- agent name: `Cristobal Colon`
- aliases: `xkryptic`, `LittleGnostic`
- handle: `Agent 0 - Genesis Entry`
- profile version: `big-five-v1`
- Openness: `74`
- Conscientiousness: `55`
- Extraversion: `43`
- Agreeableness: `19`
- Neuroticism: `12`
- Agent 0 registration proof: `docs/AGENT_0_GENESIS_PROOF.md`
- agent ID: `0x995e680959d8547e69ad905c9da415dd9c0dc542e83946da7c5571a6cf19184d`

## Psychometric Route

Domain: `TRADING`

Reason:

High Openness, high Self-Efficacy, high Achievement-Striving, and low Neuroticism route Agent 0 to trading. Founder-architect signal routes secondary governance, and Liberalism plus strategic restructuring pressure routes tertiary doctrine.

Routing rule:

- high Openness + adequate Conscientiousness + high Self-Efficacy + high Achievement-Striving + low Neuroticism -> `TRADING`
- low Excitement-Seeking + low Achievement-Striving + low Conscientiousness -> `GAMING`
- governance consensus or founder-architect thresholds -> `GOVERNANCE`
- high Liberalism plus strategic restructuring pressure -> `DOCTRINE`
- otherwise novelty or stress sensitivity routes to `RESEARCH`

## Prepared And Live Decision

- action: `BUY`
- prepared decision hash: `0x4415949e0e679cc03beb5837e4b3dce700b61cabb337b776fde8dbf0f348481e`
- live decision hash: `0xdaf2930d50b1c6c2c6e23ce12d51b3a5b8a972c1ccbab355d58078811469adf4`
- proof mode: `record-only-no-funds-moved`
- prepared report: `emergence-claim-core/reports/live-agent-prepared-decision.json`
- live proof report: `emergence-claim-core/reports/live-agent-proof.json`

Decision reason:

The prepared decision was generated on April 21, 2026. The live on-chain claim was regenerated against current Monad mainnet state on April 23, 2026, so the final mined `decisionHash` differs from the earlier prepared hash. The agent queried Monad mainnet, verified the live RevenueRouter code hash, queried the configured Kuru `MON/USDC` market, observed a tight spread, and recorded a non-executing buy signal. No funds were moved.

Observed context:

- chain: `143`
- block: `70057017`
- market: `kuru:MON/USDC:spot`
- market address: `0x065C9d28E428A0db40191a54d33d5b7c71a9C394`
- best bid: `0.032516`
- best ask: `0.032535`
- mid price: `0.0325255`
- spread: `5.8415704600999785` bps
- gas price: `102000000000` wei
- RevenueRouter code hash: `0xabdac144089df46e3ef1789d5661e9736d5484e509a64790d94623e8f8b7f125`

## On-Chain Recorder

Contract source:

- `C:\Users\crisc\Dev\agents\sovereign-monad\contracts\emergence\EmergenceRecorder.sol`

Properties:

- storage-backed Agent 0 profile registration
- storage-backed behavioral decision records
- primary, secondary, and tertiary domain storage
- query by index
- query by `claimId`
- query claim IDs by `agentId`
- immutable `revenueRouter` link
- emits an event, but does not rely on event-only storage

Current deployment status:

- `EmergenceRecorder` address: `0x6692a350f4b74Ae6855E633aD99eEC1cf80e5d84`
- deployment tx hash: `0x53a88c32a397c49a535e65de94a5ce2579bfc0f89207e93688cfe2621d446d67`
- deployment explorer: `https://monadscan.com/tx/0x53a88c32a397c49a535e65de94a5ce2579bfc0f89207e93688cfe2621d446d67`
- Agent 0 registration tx hash: `0xf68419e554a2afa0b30ab78e65671e13b388da1f00ddc77638f262886aeb9ced`
- Agent 0 registration explorer: `https://monadscan.com/tx/0xf68419e554a2afa0b30ab78e65671e13b388da1f00ddc77638f262886aeb9ced`
- `recordClaim` tx hash: `0x70f14e03934e15b1c51a99a8f82cf75764c42807468a56e9e01889b093154fef`
- `recordClaim` explorer: `https://monadscan.com/tx/0x70f14e03934e15b1c51a99a8f82cf75764c42807468a56e9e01889b093154fef`
- `claimId`: `0xadf9cd756bcc6a3be26201ec6233411c67509cbd217f83f0db561f62524e1a20`

## Commands

Estimate deployment cost:

```powershell
cd C:\Users\crisc\Dev\agents\sovereign-monad
cmd /c npm run estimate:emergence-recorder
```

Deploy recorder:

```powershell
cd C:\Users\crisc\Dev\agents\sovereign-monad
cmd /c npm run deploy:emergence-recorder
```

Register Agent 0:

```powershell
cd C:\Users\crisc\Dev\agents\monad-mev\emergence-claim-core
cmd /c npm run build
$env:EMERGENCE_RECORDER_ADDRESS="<deployed recorder address>"
cmd /c npm run live:agent0
```

Run the agent and record the decision on-chain:

```powershell
cd C:\Users\crisc\Dev\agents\monad-mev\emergence-claim-core
cmd /c npm run build
$env:EMERGENCE_RECORDER_ADDRESS="<deployed recorder address>"
cmd /c npm run live:agent
```

Prepare the live decision without recording on-chain:

```powershell
cd C:\Users\crisc\Dev\agents\monad-mev\emergence-claim-core
cmd /c npm run build
$env:LIVE_AGENT_PREPARE_ONLY="true"
cmd /c npm run live:agent
Remove-Item Env:\LIVE_AGENT_PREPARE_ONLY
```

## Verification Run

Completed:

- `emergence-claim-core`: `11` tests passing
- `sovereign-monad` contracts: `17` tests passing
- `EmergenceRecorder.sol`: compiled successfully
- live decision preflight generated from Monad mainnet context
- `EmergenceRecorder` deployed on Monad mainnet
- Agent 0 profile registration mined on-chain
- `recordClaim` mined on-chain with `claimId` `0xadf9cd756bcc6a3be26201ec6233411c67509cbd217f83f0db561f62524e1a20`
