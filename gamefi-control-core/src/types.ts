/**
 * Source lifecycle states for the GameFi rail bootstrap/Stake integration.
 *
 * BOOTSTRAP_ONLY   - Only the temporary bootstrap source is registered and active.
 *                    Normal Phase 1a state before Stake integration is real.
 * CUTOVER_PENDING  - Bootstrap and Stake sources are both registered.
 *                    Waiting for Stake source to be verified before revoking bootstrap.
 * STAKE_ACTIVE     - Stake-linked source is verified and active.
 *                    Bootstrap may still be registered for redundancy.
 * UNCONFIGURED     - No active source is configured. Should not occur in normal operation.
 */
export type SourceLifecycleState =
  | 'BOOTSTRAP_ONLY'
  | 'CUTOVER_PENDING'
  | 'STAKE_ACTIVE'
  | 'UNCONFIGURED';

export interface SourceEntry {
  /**
   * On-chain address. Null means the source has not been assigned yet.
   * Do not set to a real address until the source actually exists on-chain.
   */
  address: string | null;
  label: string;
  active: boolean;
  /**
   * Optional note for operators - e.g. "Not deployed. Set when Stake integration is real."
   */
  note?: string;
}

export interface GameFiSourceConfig {
  sources: {
    bootstrap: SourceEntry;
    stake: SourceEntry;
  };
  cutover: {
    /**
     * If true, the legacy-named slot-source-handoff script in sovereign-monad will revoke the
     * bootstrap source after the Stake source is confirmed. Defaults to false.
     * Only set true when you are ready to remove the bootstrap source permanently.
     */
    revokeBootstrapOnCutover: boolean;
  };
}

/**
 * Health snapshot emitted to the system.health Kafka topic.
 */
export interface SourceHealthPayload {
  eventId: string;
  eventType: 'GameFiSourceHealth';
  timestampMs: number;
  state: SourceLifecycleState;
  sources: {
    bootstrap: SourceEntry;
    stake: SourceEntry;
  };
  /**
   * Always true for this service. The state is derived from local config,
   * not from live on-chain reads. On-chain truth lives in the deployed
   * InboundReceiver contract, managed by sovereign-monad scripts.
   */
  configDriven: true;
  note: string;
}
