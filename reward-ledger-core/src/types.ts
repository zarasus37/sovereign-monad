export interface RewardLedgerInput {
  eventId: string;
  actorId: string;
  actorClass: 'ecosystem_native' | 'delegated_human' | 'operator_review' | 'user_linked';
  contributionScore: number;
  rewardEligible: boolean;
  rewardBand: 'none' | 'observe' | 'acknowledge';
}

export interface LedgerEntry {
  eventId: string;
  actorId: string;
  units: number;
  unit: 'internal_credit';
  rewardBand: 'observe' | 'acknowledge';
  reasons: string[];
}

export interface ActorLedgerBalance {
  actorId: string;
  units: number;
  entryCount: number;
}

export interface RewardLedgerSnapshot {
  implemented: true;
  internalOnly: true;
  entryCount: number;
  balances: ActorLedgerBalance[];
  entries: LedgerEntry[];
}
