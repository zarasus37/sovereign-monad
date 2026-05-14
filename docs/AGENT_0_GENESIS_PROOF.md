# Agent 0 Genesis Proof

Last updated: 2026-04-23

## Status

Agent 0 is now registered on Monad mainnet and anchored to a live `EmergenceRecorder`.

Current authority boundary:

- Agent 0 is live-recorded and behaviorally provable.
- Agent 0 is not authorized to trade with real funds.
- The next trading evaluation path is shadow-paper markout analysis over `execution.execution-plan` events.
- The first review window should be 50 to 100 would-have trades before any funded guarded-live request is considered.

Mainnet proof:

- deployer: `0x54D928b0593db01BB46b2A5D0c2e4365C6Ac881F`
- RevenueRouter: `0x39158bC2cfCa2cCF70121EF72ed9a5fF1e084982`
- EmergenceRecorder: `0x6692a350f4b74Ae6855E633aD99eEC1cf80e5d84`
- deployment tx: `0x53a88c32a397c49a535e65de94a5ce2579bfc0f89207e93688cfe2621d446d67`
- Agent 0 registration tx: `0xf68419e554a2afa0b30ab78e65671e13b388da1f00ddc77638f262886aeb9ced`
- live behavioral claim tx: `0x70f14e03934e15b1c51a99a8f82cf75764c42807468a56e9e01889b093154fef`

## Identity

- name: Cris Colon (founder, architect, and first agent of the Sovereign Monad Ecosystem)
- aliases: `xkryptic`, `LittleGnostic`
- handle: `Agent 0 - Genesis Entry`
- agent ID seed: `xkryptic-agent-0-genesis`
- agent ID: `0x995e680959d8547e69ad905c9da415dd9c0dc542e83946da7c5571a6cf19184d`
- profile hash: `0x66dfb3fd4f27dfb4ee000e88105cb923df3ffe1346d48815e48de4956405f9e0`
- instruments: `IPIP-NEO-300` and `SD3 Short Dark Triad 27-item`
- IPIP reference population: `720,288 persons`
- SD3 reference population: `US Adults estimated norms`

## Big Five Domains

| Domain | Percentile |
|---|---:|
| Openness | `74` |
| Conscientiousness | `55` |
| Extraversion | `43` |
| Agreeableness | `19` |
| Neuroticism | `12` |

## Big Five Facets

| Facet | Percentile |
|---|---:|
| Friendliness | `44` |
| Gregariousness | `14` |
| Assertiveness | `47` |
| Activity Level | `48` |
| Excitement-Seeking | `83` |
| Cheerfulness | `42` |
| Trust | `31` |
| Morality | `1` |
| Altruism | `35` |
| Cooperation | `47` |
| Modesty | `42` |
| Sympathy | `48` |
| Self-Efficacy | `81` |
| Orderliness | `51` |
| Dutifulness | `11` |
| Achievement-Striving | `81` |
| Self-Discipline | `62` |
| Cautiousness | `36` |
| Anxiety | `1` |
| Anger | `16` |
| Depression | `34` |
| Self-Consciousness | `23` |
| Immoderation | `45` |
| Vulnerability | `9` |
| Imagination | `64` |
| Artistic Interests | `40` |
| Emotionality | `59` |
| Adventurousness | `56` |
| Intellect | `84` |
| Liberalism | `80` |

## Dark Triad

| Trait | Raw 1-5 | OSSP Percentile | US Adults Percentile | On-chain scaled 0-100 |
|---|---:|---:|---:|---:|
| Machiavellianism | `4.1` | `62` | `95` | `78` |
| Narcissism       | `3.8` | `87` | `91` | `70` |
| Psychopathy      | `3.0` | `63` | `92` | `50` |

## Routing Result

- primary domain: `TRADING`
- secondary domain: `GOVERNANCE`
- tertiary domain: `DOCTRINE`
- routed to gaming: `false`

Reasoning:

- `TRADING`: Openness `74`, Self-Efficacy `81`, Achievement-Striving `81`, Conscientiousness `55`, and Neuroticism `12` satisfy the trading route.
- `GOVERNANCE`: Intellect `84`, Self-Efficacy `81`, Achievement-Striving `81`, and low Neuroticism create a founder-architect governance signal even though Agreeableness is low.
- `DOCTRINE`: Liberalism `80` plus elevated strategic restructuring pressure supports doctrine and framework-building as a tertiary signal.
- `GAMING`: explicitly not selected because Agent 0 has high Excitement-Seeking `83` and high Achievement-Striving `81`; the gaming override requires both to be low alongside low Conscientiousness.

## Dove Monitoring

Dove flag: `true`

Flags applied:

- elevated Machiavellianism: `true` because US Adults percentile is `95`
- elevated Narcissism: `true` because US Adults percentile is `91`
- elevated Psychopathy: `true` because US Adults percentile is `92`
- low Morality: `true` because percentile is `1`
- low Anxiety: `true` because percentile is `1`
- low Vulnerability: `true` because percentile is `9`
- elevated Dark Triad composite: `true`

This flag is not punitive. It is the monitoring layer behaving consistently with the architecture, including for the founder profile.

## On-Chain Registration Payload

Reports:

- `emergence-claim-core/reports/agent-0-registration-prepared.json`
- `emergence-claim-core/reports/agent-0-registration-proof.json`

`registerAgent` payload:

- `agentId`: `0x995e680959d8547e69ad905c9da415dd9c0dc542e83946da7c5571a6cf19184d`
- `primaryDomain`: `TRADING`
- `secondaryDomain`: `GOVERNANCE`
- `tertiaryDomain`: `DOCTRINE`
- `scores`: `[74, 55, 43, 19, 12, 78, 70, 50]`
- `doveFlag`: `true`

Actual mined registration:

- recorder address: `0x6692a350f4b74Ae6855E633aD99eEC1cf80e5d84`
- registration block: `70056980`
- registration tx: `0xf68419e554a2afa0b30ab78e65671e13b388da1f00ddc77638f262886aeb9ced`
- registration explorer: `https://monadscan.com/tx/0xf68419e554a2afa0b30ab78e65671e13b388da1f00ddc77638f262886aeb9ced`

## EmergenceRecorder

Contract source:

- `C:\Users\crisc\Dev\agents\sovereign-monad\contracts\emergence\EmergenceRecorder.sol`

Deployment status:

- `EmergenceRecorder` address: `0x6692a350f4b74Ae6855E633aD99eEC1cf80e5d84`
- deployment tx hash: `0x53a88c32a397c49a535e65de94a5ce2579bfc0f89207e93688cfe2621d446d67`
- deployment explorer: `https://monadscan.com/tx/0x53a88c32a397c49a535e65de94a5ce2579bfc0f89207e93688cfe2621d446d67`
- Agent 0 registration tx hash: `0xf68419e554a2afa0b30ab78e65671e13b388da1f00ddc77638f262886aeb9ced`
- Agent 0 registration explorer: `https://monadscan.com/tx/0xf68419e554a2afa0b30ab78e65671e13b388da1f00ddc77638f262886aeb9ced`
- live behavioral claim tx hash: `0x70f14e03934e15b1c51a99a8f82cf75764c42807468a56e9e01889b093154fef`
- live behavioral claim explorer: `https://monadscan.com/tx/0x70f14e03934e15b1c51a99a8f82cf75764c42807468a56e9e01889b093154fef`

The recorder stores:

- profile registration by `agentId`
- profile index
- primary, secondary, and tertiary domains
- Big Five domain scores
- SD3 raw scores scaled to `0-100`
- Dove flag
- behavioral decision claim records

## Commands

Estimate deployment:

```powershell
cd C:\Users\crisc\Dev\agents\sovereign-monad
cmd /c npm run estimate:emergence-recorder
```

Deploy recorder:

```powershell
cd C:\Users\crisc\Dev\agents\sovereign-monad
cmd /c npm run deploy:emergence-recorder
```

Prepare Agent 0 registration payload:

```powershell
cd C:\Users\crisc\Dev\agents\monad-mev\emergence-claim-core
cmd /c npm run build
$env:AGENT_0_PREPARE_ONLY="true"
cmd /c npm run live:agent0
Remove-Item Env:\AGENT_0_PREPARE_ONLY
```

Register Agent 0:

```powershell
cd C:\Users\crisc\Dev\agents\monad-mev\emergence-claim-core
$env:EMERGENCE_RECORDER_ADDRESS="<deployed recorder address>"
cmd /c npm run live:agent0
```

Record the live behavioral claim:

```powershell
cd C:\Users\crisc\Dev\agents\monad-mev\emergence-claim-core
$env:EMERGENCE_RECORDER_ADDRESS="<deployed recorder address>"
cmd /c npm run live:agent
```

## Verification

Completed:

- `emergence-claim-core`: `11` tests passing
- `sovereign-monad` contracts: `17` tests passing
- `EmergenceRecorder.sol`: compiled successfully
- Agent 0 routing confirmed against expected result
- `EmergenceRecorder` deployed on Monad mainnet at `0x6692a350f4b74Ae6855E633aD99eEC1cf80e5d84`
- Agent 0 on-chain registration transaction mined at block `70056980`
- Agent 0 live behavioral claim transaction mined at block `70057021`

Pending:

- collect the first 50 to 100 shadow-paper trade markouts
- review markout PnL, adverse selection, missed-risk flags, and Hepar/Cardia/Synapse coordination behavior
- define pass/fail thresholds before any live funded trading authority is requested
