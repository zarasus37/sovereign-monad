import { SlotSourceConfig, SourceHealthSnapshot, SourceLifecycleState } from '../types';

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

function hasLiveAddress(address: string | null, active: boolean): boolean {
  return active && typeof address === 'string' && ADDRESS_RE.test(address);
}

export function deriveState(config: SlotSourceConfig): SourceLifecycleState {
  const bootstrapLive = hasLiveAddress(
    config.sources.bootstrap.address,
    config.sources.bootstrap.active,
  );
  const stakeLive = hasLiveAddress(
    config.sources.stake.address,
    config.sources.stake.active,
  );

  if (bootstrapLive && !stakeLive) {
    return 'BOOTSTRAP_ONLY';
  }
  if (bootstrapLive && stakeLive) {
    return 'CUTOVER_PENDING';
  }
  if (!bootstrapLive && stakeLive) {
    return 'STAKE_ACTIVE';
  }
  return 'UNCONFIGURED';
}

export function buildSnapshotFromConfig(config: SlotSourceConfig): SourceHealthSnapshot {
  return {
    eventId: 'config-derived',
    eventType: 'SlotSourceHealth',
    timestampMs: Date.now(),
    state: deriveState(config),
    sources: config.sources,
    configDriven: true,
    note:
      'State derived locally from slot-source config. ' +
      'On-chain registration is managed separately.',
  };
}
