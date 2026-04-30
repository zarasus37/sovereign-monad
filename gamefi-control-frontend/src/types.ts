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

export interface SourceHealthSnapshot {
  eventId: string;
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

export type ApiStatus = 'loading' | 'ok' | 'error' | 'unavailable';
