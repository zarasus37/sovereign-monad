# slot-core

Slot/Stake integration surface for the Sovereign Monad Ecosystem.

## What this module is

`slot-core` is the runtime service boundary between the slot/MonadSpin funding rail and the
on-chain approved-source system managed by `sovereign-monad`.

It tracks which inflow sources are active, derives the current source lifecycle state,
and emits periodic health snapshots to the `system.health` Kafka topic so the rest of
the MEV pipeline can observe source status.

## What this module is NOT

- Not a Stake API client. Stake integration does not exist yet. Do not invent it.
- Not a contract deployer or transaction submitter. On-chain source management is handled
  entirely by `sovereign-monad/scripts/slot-source-handoff.js`.
- Not the canonical authority on approved-source truth. That lives on-chain in the deployed
  `InboundReceiver` contract.

## Source lifecycle states

| State | Condition | Meaning |
|-------|-----------|---------|
| `BOOTSTRAP_ONLY` | bootstrap active, stake not active | Normal Phase 1a operation |
| `CUTOVER_PENDING` | bootstrap + stake both active | Stake source registered, awaiting verification |
| `STAKE_ACTIVE` | bootstrap not active, stake active | Stake cutover complete |
| `UNCONFIGURED` | neither active | No source configured — should not happen in normal operation |

## How it connects to the approved-source lifecycle

The actual on-chain source lifecycle is managed in two places:

**sovereign-monad (canonical):**
- `contracts/phase1a/InboundReceiver.sol` — `setApprovedSource()` method
- `scripts/slot-source-handoff.js` — governance batch to add/revoke sources
- `docs/SLOT_SOURCE_HANDOFF.md` — lifecycle rules and cutover sequence

**slot-core (runtime mirror):**
- Reads `config/slot-source.json` to know which sources are configured locally
- Derives `SourceLifecycleState` from that config
- Emits `SlotSourceHealth` events to `system.health` topic on Kafka

The two must be kept in sync manually: after running `slot-source-handoff.js` against the
live chain, update `slot-core/config/slot-source.json` to match.

## Config

Copy the example config:

```bash
cp slot-core/config/slot-source.example.json slot-core/config/slot-source.json
```

Edit it with real addresses. Rules:
- `bootstrap.active = true` only when the bootstrap wallet is funded and registered on-chain
- `stake.active = true` only when the Stake-linked source exists on-chain and is registered
- Never set either to `true` with a placeholder address

## Usage

**Dev (ts-node):**
```bash
cd slot-core
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
import { SlotSourceMonitor, deriveState } from 'slot-core';
```

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `KAFKA_BROKERS` | required | Comma-separated Kafka broker list |
| `SLOT_HEALTH_TOPIC` | `system.health` | Topic for health snapshots |
| `KAFKA_CLIENT_ID` | `slot-core` | Kafka client ID |
| `LOG_LEVEL` | `info` | Pino log level |
| `SLOT_POLL_INTERVAL_MS` | `30000` | How often to emit a health snapshot |
| `SLOT_SOURCE_CONFIG` | `./config/slot-source.json` | Path to source config file |

## Reload without restart

Call `monitor.reload()` to pick up config changes at runtime without restarting the service.
Useful for the bootstrap → Stake cutover transition.

## Current status (Phase 1a)

- Phase 1a contracts: reconstructed, not yet deployed
- Bootstrap source: address not yet assigned (placeholder in config)
- Stake-linked source: not deployed, not configured
- Expected state once bootstrap wallet is funded: `BOOTSTRAP_ONLY`
- Expected state after Stake cutover: `STAKE_ACTIVE`

Do not change the state in config until the on-chain state actually changes.
