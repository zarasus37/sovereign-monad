# slot-api

Thin read-only HTTP wrapper for `slot-core` source health.

## What this is

A minimal Express service that reads the local `slot-source.json` config and exposes
the slot source lifecycle state over HTTP so `slot-frontend` can use live API mode.

This service is config-driven, not chain-driven.

It does not query the deployed `InboundReceiver` contract. It does not know what is
registered on-chain. It reflects what the local config file says.

On-chain source registration is managed by:

```text
sovereign-monad/scripts/slot-source-handoff.js
```

After running that script against the live chain, update
`slot-core/config/slot-source.json` or the path in `SLOT_SOURCE_CONFIG` to match.

## Endpoints

### GET /health

```json
{ "ok": true, "service": "slot-api" }
```

### GET /slot/source-health

Returns the current source lifecycle state derived from local config.

```json
{
  "eventId": "config-derived",
  "eventType": "SlotSourceHealth",
  "timestampMs": 1710000000000,
  "state": "BOOTSTRAP_ONLY",
  "sources": {
    "bootstrap": {
      "address": "0x...",
      "label": "Bootstrap Revenue Source",
      "active": true,
      "note": "..."
    },
    "stake": {
      "address": null,
      "label": "Stake-Linked Revenue Source",
      "active": false,
      "note": "..."
    }
  },
  "configDriven": true,
  "note": "Source state derived from local config file. This is not an on-chain read."
}
```

Possible `state` values:

| State | Condition |
| --- | --- |
| `BOOTSTRAP_ONLY` | Bootstrap active plus valid address, stake not active |
| `CUTOVER_PENDING` | Bootstrap and stake both active plus valid addresses |
| `STAKE_ACTIVE` | Bootstrap not active, stake active plus valid address |
| `UNCONFIGURED` | Neither source is active with a valid address |

If the config file is missing or invalid, the service returns `503` with a JSON error body.

## Setup

```powershell
cd slot-api
cmd /c npm install
Copy-Item .env.example .env
```

Edit `.env` if your config lives somewhere other than the default path.

## Config

```env
PORT=4020
SLOT_SOURCE_CONFIG=../slot-core/config/slot-source.json
LOG_LEVEL=info
```

`SLOT_SOURCE_CONFIG` defaults to `../slot-core/config/slot-source.json` relative to
the package root if not set.

## Run

```powershell
cmd /c npm run build
cmd /c npm test
cmd /c npm start
```

## Connecting slot-frontend

Point `slot-frontend` at this service by setting:

```env
VITE_SLOT_API_URL=http://localhost:4020
```

The frontend calls `GET /slot/source-health` and renders the returned state.

## Current Phase 1a status

- Phase 1a contracts are reconstructed and the live deployment is paused on deployer funding.
- Bootstrap source wallet is designated locally but not yet registered on-chain.
- Stake-linked source is not deployed, so `stake.active` must remain `false`.
- Expected initial state after live deployment and source registration is `BOOTSTRAP_ONLY`.
