# Slot Source Handoff

This document defines how the initial approved source for Phase 1a is managed after deployment.

## Purpose

The deployed `InboundReceiver` already supports approved-source management through governance.
This means the source list can be expanded when the real Stake-linked source comes online, and the bootstrap source can be revoked after cutover if desired.

This document does not change contract behavior.
It describes the operational handoff using existing `GovernanceController.execute(...)` and `InboundReceiver.setApprovedSource(...)`.

## Roles

### Deploy Operator

Owns:

- initial deployment
- saved deployment report
- approved-source inventory
- post-deploy verification

### Slot Governance Builder

Owns:

- defining the source cutover process
- documenting bootstrap source vs live Stake-linked source
- preparing the governance batch that updates approved sources

### Source Operator

Owns:

- the actual approved source wallet(s)
- sending inflow from the active source
- confirming when the real Stake-linked source is live

## Source Lifecycle

Phase 1a supports two honest states:

1. bootstrap source active
2. real Stake-linked source active

The receiver can temporarily allow both during cutover.
After verification, governance can revoke the bootstrap source.

## Cutover Rules

- never claim the Stake-linked source is live before it exists onchain
- when the real source exists, add it first
- verify it can receive inflow
- revoke the bootstrap source only after the live source is confirmed
- keep the bootstrap source if you intentionally want redundancy

## Supported Operations

The existing code already supports:

- `InboundReceiver.setApprovedSource(address source, bool approved, string label)`
- `GovernanceController.execute(target, value, data)`

That is enough to manage the slot source lifecycle without contract changes.

## Config File

Use:

- `config/slot-source-handoff.example.json`

Copy it locally to:

- `config/slot-source-handoff.json`

## Command

Run the handoff batch against the configured network:

```bash
npx hardhat run scripts/slot-source-handoff.js --network phase1a
```

## Recommended Sequence

1. deploy Phase 1a routing substrate
2. register the bootstrap source
3. wait for the real Stake-linked source to exist
4. add the real Stake-linked source
5. verify one inflow from the real source
6. revoke the bootstrap source if you no longer need it

## Reporting

The script writes a local report to:

- `deployments/slot-source-handoff-<network>.json`

This is a local operator artifact only.
