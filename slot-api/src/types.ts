/**
 * Mirrors slot-core/src/types.ts and slot-frontend/src/types.ts.
 * All three must stay in sync — this is the contract between the services.
 */

export type SourceLifecycleState =
  | 'BOOTSTRAP_ONLY'
  | 'CUTOVER_PENDING'
  | 'STAKE_ACTIVE'
  | 'UNCONFIGURED';

export interface SourceEntry {
  address: string | null;
  label: string;
  active: boolean;
  note?: string;
}

export interface SlotSourceConfig {
  sources: {
    bootstrap: SourceEntry;
    stake: SourceEntry;
  };
  cutover: {
    revokeBootstrapOnCutover: boolean;
  };
}

/**
 * Response shape for GET /slot/source-health.
 * Matches SourceHealthSnapshot in slot-frontend/src/types.ts.
 */
export interface SourceHealthResponse {
  eventId: 'config-derived';
  eventType: 'SlotSourceHealth';
  timestampMs: number;
  state: SourceLifecycleState;
  sources: {
    bootstrap: SourceEntry;
    stake: SourceEntry;
  };
  configDriven: true;
  note: string;
}
