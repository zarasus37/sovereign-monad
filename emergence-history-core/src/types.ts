import type {
  EmergenceClaim,
  EmergencePredictionEvaluationRecord,
  EmergenceRatificationRecord,
  EmergenceRetractionRecord,
  HistoricalEmergenceRecord,
} from 'emergence-claim-core';

export interface CreateEmergenceHistoryStoreInput {
  storeId?: string;
  createdAtMs?: number;
}

export interface EmergenceHistoryStore {
  localAnalysisOnly: true;
  storeId: string;
  createdAtMs: number;
  updatedAtMs: number;
  entries: HistoricalEmergenceRecord[];
}

export interface EmergenceHistorySequenceNote {
  localAnalysisOnly: true;
  claimId: string;
  note: string;
  notedAtMs: number;
}

export interface RegisteredEmergenceHistoryResult {
  store: EmergenceHistoryStore;
  record: HistoricalEmergenceRecord;
}

export interface EmergenceHistoryEntryView {
  claim: EmergenceClaim;
  ratification: EmergenceRatificationRecord;
  predictionEvaluation?: EmergencePredictionEvaluationRecord;
  retraction?: EmergenceRetractionRecord;
}
