# Integration

## Current contract

The UI does not mutate on-chain state. It renders gaming-rail source status from either:

- the `gamefi-control-api` HTTP surface, or
- a static config JSON file that matches `gamefi-control-core`

## Expected API

`GET /gamefi/source-health`

Response shape:

```json
{
  "eventId": "uuid",
  "eventType": "GameFiSourceHealth",
  "timestampMs": 1710000000000,
  "state": "BOOTSTRAP_ONLY",
  "sources": {
    "bootstrap": {
      "address": "0x...",
      "label": "Bootstrap Revenue Source",
      "active": true
    },
    "stake": {
      "address": null,
      "label": "Stake-Linked Revenue Source",
      "active": false
    }
  },
  "configDriven": true,
  "note": "..."
}
```

## Config mode

If no API is available, serve a file that matches `gamefi-control-core/config/gamefi-source.example.json`.
The frontend derives the same lifecycle state locally.

This frontend replaces the old `slot-frontend` naming. The current routes and files are the GameFi control surface.
