import { randomUUID } from 'crypto';
import {
  ActiveOrganismSubsystemSnapshotRef,
  CreateAnyEmergenceClaimInput,
  EmergenceClaim,
  EmergenceCausalNecessityArgument,
  EmergenceEvidenceRef,
  EmergenceEventWindow,
  EmergenceFalsifiablePrediction,
  EmergenceNotificationSurface,
  EmergencePredictionEvaluationRecord,
  EmergenceRatificationRecord,
  EmergenceRetractionRecord,
  EmergenceStreamSnapshotRef,
  HistoricalEmergenceRecord,
  PromoteEmergenceClaimInput,
  RatifyEmergenceClaimInput,
  RecordPredictionEvaluationInput,
  RejectEmergenceClaimInput,
  RetractEmergenceClaimInput,
} from './types';

const ALLOWED_NOTIFICATION_SURFACES: EmergenceNotificationSurface[] = [
  'historical_record',
  'narrative_read_path',
];

function cloneEventWindow(window: EmergenceEventWindow): EmergenceEventWindow {
  return { ...window };
}

function cloneEvidenceRef(ref: EmergenceEvidenceRef): EmergenceEvidenceRef {
  return { ...ref };
}

function cloneCausalNecessityArgument(
  argument: EmergenceCausalNecessityArgument,
): EmergenceCausalNecessityArgument {
  return { ...argument };
}

function cloneStreamSnapshotRef(ref: EmergenceStreamSnapshotRef): EmergenceStreamSnapshotRef {
  return { ...ref };
}

function cloneActiveSubsystemRef(
  ref: ActiveOrganismSubsystemSnapshotRef,
): ActiveOrganismSubsystemSnapshotRef {
  return { ...ref };
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

function validateNotificationSurfaces(
  surfaces: EmergenceNotificationSurface[],
): EmergenceNotificationSurface[] {
  if (surfaces.length === 0) {
    throw new Error('At least one notification surface is required.');
  }

  const unique = Array.from(new Set(surfaces));
  for (const surface of unique) {
    if (!ALLOWED_NOTIFICATION_SURFACES.includes(surface)) {
      throw new Error(`Notification surface ${surface} is not allowed.`);
    }
  }
  if (!unique.includes('historical_record')) {
    throw new Error('historical_record notification is required.');
  }

  return unique;
}

function assertClaimState(
  claim: EmergenceClaim,
  allowedStates: EmergenceClaim['state'][],
  action: string,
) {
  if (!allowedStates.includes(claim.state)) {
    throw new Error(
      `Cannot ${action} when claim is ${claim.state}; expected one of ${allowedStates.join(', ')}.`,
    );
  }
}

function appendStatusNote(
  claim: EmergenceClaim,
  note: string,
  changedAtMs: number,
): EmergenceClaim {
  return {
    ...claim,
    lastStateChangeAtMs: changedAtMs,
    statusNotes: [...claim.statusNotes, note],
  };
}

function validateSharedClaimInputs(input: CreateAnyEmergenceClaimInput) {
  if (input.metricSourceId === input.narrativeSourceId) {
    throw new Error('metricSourceId and narrativeSourceId must be different.');
  }
  if (input.metricGenerationPath.trim().length === 0) {
    throw new Error('metricGenerationPath is required.');
  }
  if (input.narrativeGenerationPath.trim().length === 0) {
    throw new Error('narrativeGenerationPath is required.');
  }
  if (input.metricEvidence.length === 0) {
    throw new Error('At least one metric evidence reference is required.');
  }
  if (input.substrateSummaryRefs.length === 0) {
    throw new Error('At least one substrate summary reference is required.');
  }
  if (input.streamsSampled.length === 0) {
    throw new Error('At least one sampled stream is required.');
  }
}

function validateCausalSetInput(input: CreateAnyEmergenceClaimInput) {
  if (input.tier !== 'causal_set') {
    return;
  }
  if (input.causalStreamSet.length < 2) {
    throw new Error('causal_set claims require at least two causal streams.');
  }
  if (input.causalNecessityArguments.length !== input.causalStreamSet.length) {
    throw new Error(
      'causal_set claims require one causal necessity argument for each causal stream.',
    );
  }

  const sampledStreamIds = new Set(input.streamsSampled.map((stream) => stream.streamId));
  const argumentStreamIds = new Set(input.causalNecessityArguments.map((argument) => argument.streamId));
  for (const stream of input.causalStreamSet) {
    if (!sampledStreamIds.has(stream.streamId)) {
      throw new Error(`Causal stream ${stream.streamId} must also appear in streamsSampled.`);
    }
    if (!argumentStreamIds.has(stream.streamId)) {
      throw new Error(
        `Causal stream ${stream.streamId} must have a matching causal necessity argument.`,
      );
    }
  }
}

function validateFullFieldInput(input: CreateAnyEmergenceClaimInput) {
  if (input.tier !== 'full_field') {
    return;
  }
  if (input.activeSubsystemSet.length === 0) {
    throw new Error('full_field claims require at least one active subsystem snapshot.');
  }
}

export function createEmergenceClaim(input: CreateAnyEmergenceClaimInput): EmergenceClaim {
  validateSharedClaimInputs(input);
  validateCausalSetInput(input);
  validateFullFieldInput(input);

  const createdAtMs = input.createdAtMs ?? Date.now();
  const base = {
    localAnalysisOnly: true as const,
    claimId: input.claimId ?? randomUUID(),
    tier: input.tier,
    state: 'evidence_insufficient' as const,
    eventWindow: cloneEventWindow(input.eventWindow),
    candidateEventSummary: input.candidateEventSummary,
    nonDecomposabilityBasis: input.nonDecomposabilityBasis,
    metricEvidence: input.metricEvidence.map(cloneEvidenceRef),
    comprehensionalExplanation: input.comprehensionalExplanation,
    falsifiablePrediction: {
      ...input.falsifiablePrediction,
      evaluationWindow: cloneEventWindow(input.falsifiablePrediction.evaluationWindow),
    },
    observerPackageVersion: input.observerPackageVersion,
    substrateSummaryRefs: input.substrateSummaryRefs.map(cloneEvidenceRef),
    streamsSampled: input.streamsSampled.map(cloneStreamSnapshotRef),
    metricSourceId: input.metricSourceId,
    narrativeSourceId: input.narrativeSourceId,
    metricGenerationPath: input.metricGenerationPath,
    narrativeGenerationPath: input.narrativeGenerationPath,
    createdAtMs,
    createdBy: input.createdBy,
    lastStateChangeAtMs: createdAtMs,
    statusNotes: [...(input.statusNotes ?? [])],
  };

  if (input.tier === 'causal_set') {
    return {
      ...base,
      tier: 'causal_set',
      causalStreamSet: input.causalStreamSet.map(cloneStreamSnapshotRef),
      causalNecessityArguments: input.causalNecessityArguments.map(cloneCausalNecessityArgument),
    };
  }

  return {
    ...base,
    tier: 'full_field',
    activeSubsystemSet: input.activeSubsystemSet.map(cloneActiveSubsystemRef),
  };
}

export function markClaimCandidate(
  claim: EmergenceClaim,
  input: PromoteEmergenceClaimInput,
): EmergenceClaim {
  assertClaimState(claim, ['evidence_insufficient'], 'mark claim candidate');
  const changedAtMs = input.changedAtMs ?? Date.now();
  return appendStatusNote(
    {
      ...cloneClaim(claim),
      state: 'candidate',
    },
    input.reason,
    changedAtMs,
  );
}

export function markClaimNotCandidate(
  claim: EmergenceClaim,
  input: RejectEmergenceClaimInput,
): EmergenceClaim {
  assertClaimState(claim, ['evidence_insufficient'], 'mark claim not-candidate');
  const changedAtMs = input.changedAtMs ?? Date.now();
  return appendStatusNote(
    {
      ...cloneClaim(claim),
      state: 'not_candidate',
    },
    input.reason,
    changedAtMs,
  );
}

export function ratifyEmergenceClaim(
  claim: EmergenceClaim,
  input: RatifyEmergenceClaimInput,
): EmergenceRatificationRecord {
  assertClaimState(claim, ['candidate'], 'ratify claim');
  const ratifiedAtMs = input.ratifiedAtMs ?? Date.now();
  const notifiedSurfaces = validateNotificationSurfaces(
    input.notifiedSurfaces ?? ['historical_record'],
  );

  return {
    localAnalysisOnly: true,
    ratificationId: input.ratificationId ?? randomUUID(),
    claimId: claim.claimId,
    ratifiedBy: input.ratifiedBy,
    ratifiedAtMs,
    ratifierJustification: input.ratifierJustification,
    falsifiablePredictionEvaluation: input.falsifiablePredictionEvaluation,
    notifiedSurfaces,
  };
}

export function recordPredictionEvaluation(
  claim: EmergenceClaim,
  ratification: EmergenceRatificationRecord,
  input: RecordPredictionEvaluationInput,
): EmergencePredictionEvaluationRecord {
  assertClaimState(claim, ['candidate'], 'record prediction evaluation');
  if (ratification.claimId !== claim.claimId) {
    throw new Error('Ratification record does not match the claim being evaluated.');
  }

  return {
    localAnalysisOnly: true,
    evaluationId: input.evaluationId ?? randomUUID(),
    claimId: claim.claimId,
    evaluatedBy: input.evaluatedBy,
    evaluatedAtMs: input.evaluatedAtMs ?? Date.now(),
    predictionOutcome: input.predictionOutcome,
    outcomeNotes: input.outcomeNotes,
  };
}

export function retractEmergenceClaim(
  claim: EmergenceClaim,
  ratification: EmergenceRatificationRecord,
  input: RetractEmergenceClaimInput,
): EmergenceRetractionRecord {
  assertClaimState(claim, ['candidate'], 'retract claim');
  if (ratification.claimId !== claim.claimId) {
    throw new Error('Ratification record does not match the claim being retracted.');
  }

  const retractedAtMs = input.retractedAtMs ?? Date.now();
  const notifiedSurfaces = validateNotificationSurfaces(
    input.notifiedSurfaces ?? ratification.notifiedSurfaces,
  );

  return {
    localAnalysisOnly: true,
    retractionId: input.retractionId ?? randomUUID(),
    claimId: claim.claimId,
    retractedBy: input.retractedBy,
    retractedAtMs,
    retractionBasis: input.retractionBasis,
    retractionDetail: input.retractionDetail,
    notifiedSurfaces,
  };
}

export function buildHistoricalEmergenceRecord(
  claim: EmergenceClaim,
  ratification: EmergenceRatificationRecord,
  predictionEvaluation?: EmergencePredictionEvaluationRecord,
  retraction?: EmergenceRetractionRecord,
): HistoricalEmergenceRecord {
  if (claim.claimId !== ratification.claimId) {
    throw new Error('Ratification record does not match the supplied claim.');
  }
  if (predictionEvaluation && predictionEvaluation.claimId !== claim.claimId) {
    throw new Error('Prediction evaluation record does not match the supplied claim.');
  }
  if (retraction && retraction.claimId !== claim.claimId) {
    throw new Error('Retraction record does not match the supplied claim.');
  }
  if (claim.state !== 'candidate') {
    throw new Error('Historical record can be built only from candidate claims.');
  }

  return {
    localAnalysisOnly: true,
    recordStatus: retraction ? 'retracted' : 'ratified',
    claim: cloneClaim(claim),
    ratification: {
      ...ratification,
      notifiedSurfaces: [...ratification.notifiedSurfaces],
    },
    predictionEvaluation: predictionEvaluation
      ? {
          ...predictionEvaluation,
        }
      : undefined,
    retraction: retraction
      ? {
          ...retraction,
          notifiedSurfaces: [...retraction.notifiedSurfaces],
        }
      : undefined,
    readableBy: [...ratification.notifiedSurfaces],
  };
}

export function loadExampleEmergenceClaimBundle(): {
  claim: EmergenceClaim;
  ratification: EmergenceRatificationRecord;
  record: HistoricalEmergenceRecord;
} {
  const claim = markClaimCandidate(
    createEmergenceClaim({
      claimId: 'example-emergence-claim',
      tier: 'causal_set',
      causalStreamSet: [
        {
          streamId: 'router_execution',
          snapshotRef: 'deployments/phase1a-progress-example.json#execution',
          summary: 'first live bounded execution signal',
        },
        {
          streamId: 'oracle_window',
          snapshotRef: 'oracle-core/example#balanced-window',
          summary: 'bounded live regime context',
        },
      ],
      streamsSampled: [
        {
          streamId: 'router_execution',
          snapshotRef: 'deployments/phase1a-progress-example.json#execution',
          summary: 'first live bounded execution signal',
        },
        {
          streamId: 'oracle_window',
          snapshotRef: 'oracle-core/example#balanced-window',
          summary: 'bounded live regime context',
        },
        {
          streamId: 'gnosis_window',
          snapshotRef: 'gnosis-core/example#retrospective-window',
          summary: 'retrospective integrity surface sampled during claim creation',
        },
      ],
      eventWindow: {
        label: 'example-window',
        startTimestampMs: 1710000000000,
        endTimestampMs: 1710003600000,
      },
      candidateEventSummary:
        'A bounded execution path produced a behavior pattern not explained by the execution or oracle lane alone.',
      nonDecomposabilityBasis:
        'Removing the oracle context reduces the event to execution recurrence; removing the execution lane removes the event entirely.',
      metricEvidence: [
        {
          evidenceId: 'metric-1',
          surface: 'execution_truth',
          ref: 'execution-truth-core/example#bounded-live-window',
          summary: 'bounded live path completed cleanly',
        },
      ],
      comprehensionalExplanation:
        'The event is coherent only when the execution lane and oracle context are treated as a coupled causal set.',
      falsifiablePrediction: {
        predictionStatement:
          'A similar bounded window should produce a recognizable descendant under equivalent oracle posture.',
        predictionScope: 'agent_behavioral',
        evaluationWindow: {
          label: 'next-window',
          startTimestampMs: 1710003600001,
          endTimestampMs: 1710007200000,
        },
        falsificationCondition:
          'No recognizable descendant appears under equivalent oracle posture in the next bounded window.',
        confirmationCondition:
          'A recognizable descendant appears under equivalent oracle posture in the next bounded window.',
      },
      observerPackageVersion: '0.2.0',
      substrateSummaryRefs: [
        {
          evidenceId: 'substrate-1',
          surface: 'emergence_observer',
          ref: 'emergence-observer-core/example#observable',
          summary: 'substrate observation reached observable readiness',
        },
      ],
      metricSourceId: 'execution-truth-core',
      narrativeSourceId: 'narrative-core',
      metricGenerationPath: 'execution-truth-core -> bounded-live-window aggregation',
      narrativeGenerationPath: 'narrative-core -> retrospective cross-stream explanation',
      causalNecessityArguments: [
        {
          streamId: 'router_execution',
          snapshotRef: 'deployments/phase1a-progress-example.json#execution',
          necessityArgument:
            'Without the live execution lane, the candidate event does not occur at all.',
        },
        {
          streamId: 'oracle_window',
          snapshotRef: 'oracle-core/example#balanced-window',
          necessityArgument:
            'Without the oracle posture, the event collapses into execution recurrence rather than coupled emergence.',
        },
      ],
      createdAtMs: 1710007200001,
      createdBy: 'emergence-observer-core',
    }),
    {
      reason: 'claim cleared local completeness checks and is ready for human review',
      changedAtMs: 1710007200500,
    },
  );

  const ratification = ratifyEmergenceClaim(claim, {
    ratificationId: 'example-ratification',
    ratifiedBy: 'human-reviewer',
    ratifiedAtMs: 1710007201000,
    ratifierJustification:
      'The evidence and explanation jointly clear the causal-set emergence bar for this bounded window.',
    falsifiablePredictionEvaluation:
      'Prediction is explicit, bounded, and falsifiable in the next evaluation window.',
    notifiedSurfaces: ['historical_record', 'narrative_read_path'],
  });

  return {
    claim,
    ratification,
    record: buildHistoricalEmergenceRecord(claim, ratification),
  };
}
