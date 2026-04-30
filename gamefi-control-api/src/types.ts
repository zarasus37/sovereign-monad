/**
 * Mirrors gamefi-control-core/src/types.ts and gamefi-control-frontend/src/types.ts.
 * All three must stay in sync - this is the contract between the services.
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

export interface GameFiSourceConfig {
  sources: {
    bootstrap: SourceEntry;
    stake: SourceEntry;
  };
  cutover: {
    revokeBootstrapOnCutover: boolean;
  };
}

/**
 * Response shape for GET /gamefi/source-health.
 * Matches SourceHealthSnapshot in gamefi-control-frontend/src/types.ts.
 */
export interface SourceHealthResponse {
  eventId: 'config-derived';
  eventType: 'GameFiSourceHealth';
  timestampMs: number;
  state: SourceLifecycleState;
  sources: {
    bootstrap: SourceEntry;
    stake: SourceEntry;
  };
  configDriven: true;
  note: string;
}
