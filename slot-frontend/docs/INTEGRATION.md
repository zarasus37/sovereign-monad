# Integration

## Current contract

The UI does not mutate on-chain state. It renders slot source status from either:

- a future HTTP wrapper around `slot-core` output, or
- a static config JSON file that matches `slot-core`

## Expected API

`GET /slot/source-health`

Response shape:

```json
{
  "eventId": "uuid",
  "eventType": "SlotSourceHealth",
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

If no API is available, serve a file that matches `slot-core/config/slot-source.example.json`.
The frontend derives the same lifecycle state locally.
