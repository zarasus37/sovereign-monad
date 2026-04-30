import { randomUUID } from 'crypto';
import type {
  ActiveOrganismSubsystemSnapshotRef,
  EmergenceClaim,
  EmergenceCausalNecessityArgument,
  EmergenceEvidenceRef,
  EmergenceEventWindow,
  EmergenceFalsifiablePrediction,
  EmergencePredictionEvaluationRecord,
  EmergenceRatificationRecord,
  EmergenceRetractionRecord,
  EmergenceStreamSnapshotRef,
  HistoricalEmergenceRecord,
} from 'emergence-claim-core';
import { buildHistoricalEmergenceRecord } from 'emergence-claim-core';
import type {
  CreateEmergenceHistoryStoreInput,
  EmergenceHistoryEntryView,
  EmergenceHistorySequenceNote,
  EmergenceHistoryStore,
  RegisteredEmergenceHistoryResult,
} from './types';

function cloneEventWindow(window: EmergenceEventWindow): EmergenceEventWindow {
  return { ...window };
}

function cloneEvidenceRef(ref: EmergenceEvidenceRef): EmergenceEvidenceRef {
  return { ...ref };
}

function cloneStreamSnapshotRef(ref: EmergenceStreamSnapshotRef): EmergenceStreamSnapshotRef {
  return { ...ref };
}

function cloneActiveSubsystemRef(
  ref: ActiveOrganismSubsystemSnapshotRef,
): ActiveOrganismSubsystemSnapshotRef {
  return { ...ref };
}

function cloneCausalNecessityArgument(
  argument: EmergenceCausalNecessityArgument,
): EmergenceCausalNecessityArgument {
  return { ...argument };
}

function clonePrediction(
  prediction: EmergenceFalsifiablePrediction,
): EmergenceFalsifiablePrediction {
  return {
    ...prediction,
    evaluationWindow: cloneEventWindow(prediction.evaluationWindow),
  };
}

function cloneClaim(claim: EmergenceClaim): EmergenceClaim {
  const base = {
    localAnalysisOnly: true as const,
    claimId: claim.claimId,
    state: claim.state,
    eventWindow: cloneEventWindow(claim.eventWindow),
    candidateEventSummary: claim.candidateEventSummary,
    nonDecomposabilityBasis: claim.nonDecomposabilityBasis,
    metricEvidence: claim.metricEvidence.map(cloneEvidenceRef),
    comprehensionalExplanation: claim.comprehensionalExplanation,
    falsifiablePrediction: clonePrediction(claim.falsifiablePrediction),
    observerPackageVersion: claim.observerPackageVersion,
    substrateSummaryRefs: claim.substrateSummaryRefs.map(cloneEvidenceRef),
    streamsSampled: claim.streamsSampled.map(cloneStreamSnapshotRef),
    metricSourceId: claim.metricSourceId,
    narrativeSourceId: claim.narrativeSourceId,
    metricGenerationPath: claim.metricGenerationPath,
    narrativeGenerationPath: claim.narrativeGenerationPath,
    createdAtMs: claim.createdAtMs,
    createdBy: claim.createdBy,
    lastStateChangeAtMs: claim.lastStateChangeAtMs,
    statusNotes: [...claim.statusNotes],
  };

  if (claim.tier === 'causal_set') {
    return {
      ...base,
      tier: 'causal_set',
      causalStreamSet: claim.causalStreamSet.map(cloneStreamSnapshotRef),
      causalNecessityArguments: claim.causalNecessityArguments.map(cloneCausalNecessityArgument),
    };
  }

  return {
    ...base,
    tier: 'full_field',
    activeSubsystemSet: claim.activeSubsystemSet.map(cloneActiveSubsystemRef),
  };
}

function cloneHistoryRecord(record: HistoricalEmergenceRecord): HistoricalEmergenceRecord {
  return {
    ...record,
    claim: cloneClaim(record.claim),
    ratification: {
      ...record.ratification,
      notifiedSurfaces: [...record.ratification.notifiedSurfaces],
    },
    predictionEvaluation: record.predictionEvaluation
      ? { ...record.predictionEvaluation }
      : undefined,
    retraction: record.retraction
      ? {
          ...record.retraction,
          notifiedSurfaces: [...record.retraction.notifiedSurfaces],
        }
      : undefined,
    readableBy: [...record.readableBy],
  };
}

function cloneStore(store: EmergenceHistoryStore): EmergenceHistoryStore {
  return {
    ...store,
    entries: store.entries.map(cloneHistoryRecord),
  };
}

function assertCandidateClaim(claim: EmergenceClaim, action: string) {
  if (claim.state !== 'candidate') {
    throw new Error(`Cannot ${action} for claim state ${claim.state}; expected candidate.`);
  }
}

function findEntryIndex(store: EmergenceHistoryStore, claimId: string): number {
  return store.entries.findIndex((entry) => entry.claim.claimId === claimId);
}

export function createEmergenceHistoryStore(
  input: CreateEmergenceHistoryStoreInput = {},
): EmergenceHistoryStore {
  const createdAtMs = input.createdAtMs ?? Date.now();
  return {
    localAnalysisOnly: true,
    storeId: input.storeId ?? randomUUID(),
    createdAtMs,
    updatedAtMs: createdAtMs,
    entries: [],
  };
}

export function registerRatifiedEmergence(
  store: EmergenceHistoryStore,
  claim: EmergenceClaim,
  ratification: EmergenceRatificationRecord,
): RegisteredEmergenceHistoryResult {
  assertCandidateClaim(claim, 'register ratified emergence');
  if (ratification.claimId !== claim.claimId) {
    throw new Error('Ratification record does not match the supplied claim.');
  }
  if (findEntryIndex(store, claim.claimId) !== -1) {
    throw new Error(`Claim ${claim.claimId} is already present in the history store.`);
  }

  const record = buildHistoricalEmergenceRecord(claim, ratification);
  const nextStore = cloneStore(store);
  nextStore.entries.push(record);
  nextStore.updatedAtMs = ratification.ratifiedAtMs;

  return {
    store: nextStore,
    record: cloneHistoryRecord(record),
  };
}

export function recordHistoricalPredictionEvaluation(
  store: EmergenceHistoryStore,
  evaluation: EmergencePredictionEvaluationRecord,
): RegisteredEmergenceHistoryResult {
  const index = findEntryIndex(store, evaluation.claimId);
  if (index === -1) {
    throw new Error(`Claim ${evaluation.claimId} is not present in the history store.`);
  }

  const nextStore = cloneStore(store);
  const current = nextStore.entries[index];
  if (current.retraction) {
    throw new Error(`Claim ${evaluation.claimId} is already retracted and cannot accept evaluation.`);
  }
  if (current.predictionEvaluation) {
    throw new Error(`Claim ${evaluation.claimId} already has a recorded prediction evaluation.`);
  }

  const updatedRecord = buildHistoricalEmergenceRecord(
    current.claim,
    current.ratification,
    evaluation,
    current.retraction,
  );
  nextStore.entries[index] = updatedRecord;
  nextStore.updatedAtMs = evaluation.evaluatedAtMs;

  return {
    store: nextStore,
    record: cloneHistoryRecord(updatedRecord),
  };
}

export function retractHistoricalEmergence(
  store: EmergenceHistoryStore,
  retraction: EmergenceRetractionRecord,
): RegisteredEmergenceHistoryResult {
  const index = findEntryIndex(store, retraction.claimId);
  if (index === -1) {
    throw new Error(`Claim ${retraction.claimId} is not present in the history store.`);
  }

  const nextStore = cloneStore(store);
  const current = nextStore.entries[index];
  if (current.retraction) {
    throw new Error(`Claim ${retraction.claimId} is already retracted in the history store.`);
  }

  const updatedRecord = buildHistoricalEmergenceRecord(
    current.claim,
    current.ratification,
    current.predictionEvaluation,
    retraction,
  );
  nextStore.entries[index] = updatedRecord;
  nextStore.updatedAtMs = retraction.retractedAtMs;

  return {
    store: nextStore,
    record: cloneHistoryRecord(updatedRecord),
  };
}

export function getEmergenceHistoryEntry(
  store: EmergenceHistoryStore,
  claimId: string,
): EmergenceHistoryEntryView | undefined {
  const index = findEntryIndex(store, claimId);
  if (index === -1) {
    return undefined;
  }

  const entry = cloneHistoryRecord(store.entries[index]);
  return {
    claim: entry.claim,
    ratification: entry.ratification,
    predictionEvaluation: entry.predictionEvaluation,
    retraction: entry.retraction,
  };
}

export function createSequenceIntegrityNote(
  claimId: string,
  note: string,
  notedAtMs = Date.now(),
): EmergenceHistorySequenceNote {
  return {
    localAnalysisOnly: true,
    claimId,
    note,
    notedAtMs,
  };
}
