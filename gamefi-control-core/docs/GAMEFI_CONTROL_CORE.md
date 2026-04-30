# gamefi-control-core

Source-lifecycle integration surface for the high-fidelity DeFi gaming rail.

## What this module is

`gamefi-control-core` is the runtime service boundary between the high-fidelity DeFi gaming funding rail and the on-chain approved-source system managed by `sovereign-monad`.

It tracks which inflow sources are active, derives the current source lifecycle state, and emits periodic health snapshots to the `system.health` Kafka topic so the rest of the runtime can observe source status.

## What this module is not

- Not a Stake API client. Stake integration does not exist yet. Do not invent it.
- Not a game client. This package only handles source-lifecycle state.
- Not a contract deployer or transaction submitter. On-chain source management is handled entirely by `sovereign-monad/scripts/slot-source-handoff.js`.
- Not the canonical authority on approved-source truth. That lives on-chain in the deployed `InboundReceiver` contract.

## Naming note

This package replaces the old `slot-core` naming.
The current doctrine treats it as transitional control scaffolding for the broader high-fidelity DeFi gaming rail.
Do not read the old slot naming as the current product thesis.

## Source lifecycle states

| State | Condition | Meaning |
| --- | --- | --- |
| `BOOTSTRAP_ONLY` | bootstrap active, stake not active | Normal Phase 1a operation |
| `CUTOVER_PENDING` | bootstrap + stake both active | Stake source registered, awaiting verification |
| `STAKE_ACTIVE` | bootstrap not active, stake active | Stake cutover complete |
| `UNCONFIGURED` | neither active | No source configured - should not happen in normal operation |

## How it connects to the approved-source lifecycle

The actual on-chain source lifecycle is managed in two places:

**sovereign-monad (canonical):**
- `contracts/phase1a/InboundReceiver.sol` - `setApprovedSource()` method
- `scripts/slot-source-handoff.js` - governance batch to add/revoke sources
- `docs/SLOT_SOURCE_HANDOFF.md` - lifecycle rules and cutover sequence

**gamefi-control-core (runtime mirror):**
- Reads `config/gamefi-source.json` to know which sources are configured locally
- Derives `SourceLifecycleState` from that config
- Emits `GameFiSourceHealth` events to the `system.health` Kafka topic

The two must be kept in sync manually: after running `slot-source-handoff.js` against the live chain, update `gamefi-control-core/config/gamefi-source.json` to match.

## Config

Copy the example config:

```bash
cp gamefi-control-core/config/gamefi-source.example.json gamefi-control-core/config/gamefi-source.json
```

Edit it with real addresses. Rules:
- `bootstrap.active = true` only when the bootstrap wallet is funded and registered on-chain
- `stake.active = true` only when the Stake-linked source exists on-chain and is registered
- Never set either to `true` with a placeholder address

## Usage

**Dev (ts-node):**
```bash
cd gamefi-control-core
npm install
KAFKA_BROKERS=localhost:9092 npm run dev
```

**Production:**
```bash
npm run build
npm start
```

**As a library (import from another service):**
```typescript
import { GameFiSourceMonitor, deriveState } from 'gamefi-control-core';
```

## Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `KAFKA_BROKERS` | required | Comma-separated Kafka broker list |
| `GAMEFI_HEALTH_TOPIC` | `system.health` | Topic for health snapshots |
| `KAFKA_CLIENT_ID` | `gamefi-control-core` | Kafka client ID |
| `LOG_LEVEL` | `info` | Pino log level |
| `GAMEFI_POLL_INTERVAL_MS` | `30000` | How often to emit a health snapshot |
| `GAMEFI_SOURCE_CONFIG` | `./config/gamefi-source.json` | Path to source config file |

## Reload without restart

Call `monitor.reload()` to pick up config changes at runtime without restarting the service.
Useful for the bootstrap -> Stake cutover transition.

## Phase-alignment note

- Keep local config aligned with the canonical Phase 1a state recorded in `sovereign-monad`
- Bootstrap source should reflect the current approved bootstrap source on-chain
- Stake-linked source must remain inactive until it actually exists on-chain
- Expected state after bootstrap registration is `BOOTSTRAP_ONLY`
- Expected state after Stake cutover is `STAKE_ACTIVE`

Do not change the state in config until the on-chain state actually changes.
