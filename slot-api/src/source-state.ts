import fs from 'fs';
import { SlotSourceConfig, SourceLifecycleState } from './types';

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

function isValidAddress(addr: string | null | undefined): boolean {
  return typeof addr === 'string' && ADDRESS_RE.test(addr);
}

export function deriveState(config: SlotSourceConfig): SourceLifecycleState {
  const bootstrapLive =
    config.sources.bootstrap.active && isValidAddress(config.sources.bootstrap.address);

  const stakeLive = config.sources.stake.active && isValidAddress(config.sources.stake.address);

  if (bootstrapLive && !stakeLive) return 'BOOTSTRAP_ONLY';
  if (bootstrapLive && stakeLive) return 'CUTOVER_PENDING';
  if (!bootstrapLive && stakeLive) return 'STAKE_ACTIVE';
  return 'UNCONFIGURED';
}

export function validateSourceConfig(config: SlotSourceConfig): string[] {
  const errors: string[] = [];

  if (!config || typeof config !== 'object') {
    errors.push('config must be an object');
    return errors;
  }

  if (!config.sources || typeof config.sources !== 'object') {
    errors.push('config.sources is required');
    return errors;
  }

  const { bootstrap, stake } = config.sources;

  if (!bootstrap || typeof bootstrap !== 'object') {
    errors.push('config.sources.bootstrap is required');
  } else {
    if (typeof bootstrap.active !== 'boolean') {
      errors.push('config.sources.bootstrap.active must be a boolean');
    }
    if (bootstrap.active && !isValidAddress(bootstrap.address)) {
      errors.push(
        'config.sources.bootstrap.address must be a valid 0x address when active=true',
      );
    }
    if (typeof bootstrap.label !== 'string' || !bootstrap.label.trim()) {
      errors.push('config.sources.bootstrap.label must be a non-empty string');
    }
  }

  if (!stake || typeof stake !== 'object') {
    errors.push('config.sources.stake is required');
  } else {
    if (typeof stake.active !== 'boolean') {
      errors.push('config.sources.stake.active must be a boolean');
    }
    if (stake.active && !isValidAddress(stake.address)) {
      errors.push(
        'config.sources.stake.address must be a valid 0x address when active=true. ' +
          'Do not set active=true until the Stake-linked source exists on-chain.',
      );
    }
    if (typeof stake.label !== 'string' || !stake.label.trim()) {
      errors.push('config.sources.stake.label must be a non-empty string');
    }
  }

  if (!config.cutover || typeof config.cutover !== 'object') {
    errors.push('config.cutover is required');
  } else if (typeof config.cutover.revokeBootstrapOnCutover !== 'boolean') {
    errors.push('config.cutover.revokeBootstrapOnCutover must be a boolean');
  }

  return errors;
}

export function loadSourceConfig(configPath: string): SlotSourceConfig | null {
  if (!fs.existsSync(configPath)) return null;
  const raw = fs.readFileSync(configPath, 'utf8').replace(/^\uFEFF/, '');
  return JSON.parse(raw) as SlotSourceConfig;
}
