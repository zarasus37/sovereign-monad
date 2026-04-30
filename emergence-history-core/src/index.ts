import {
  createEmergenceClaim,
  markClaimCandidate,
  ratifyEmergenceClaim,
  recordPredictionEvaluation,
  retractEmergenceClaim,
} from 'emergence-claim-core';
import {
  createEmergenceHistoryStore,
  createSequenceIntegrityNote,
  getEmergenceHistoryEntry,
  recordHistoricalPredictionEvaluation,
  registerRatifiedEmergence,
  retractHistoricalEmergence,
} from './history';
import type {
  CreateEmergenceHistoryStoreInput,
  EmergenceHistoryEntryView,
  EmergenceHistorySequenceNote,
  EmergenceHistoryStore,
  RegisteredEmergenceHistoryResult,
} from './types';

export {
  createEmergenceHistoryStore,
  createSequenceIntegrityNote,
  getEmergenceHistoryEntry,
  recordHistoricalPredictionEvaluation,
  registerRatifiedEmergence,
  retractHistoricalEmergence,
};

export type {
  CreateEmergenceHistoryStoreInput,
  EmergenceHistoryEntryView,
  EmergenceHistorySequenceNote,
  EmergenceHistoryStore,
  RegisteredEmergenceHistoryResult,
};

function main() {
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
      causalNecessityArguments: [
        {
          streamId: 'router_execution',
          snapshotRef: 'deployments/phase1a-progress-example.json#execution',
          necessityArgument: 'Without the live execution lane, the candidate event does not occur.',
        },
        {
          streamId: 'oracle_window',
          snapshotRef: 'oracle-core/example#balanced-window',
          necessityArgument:
            'Without the oracle posture, the event reduces to bounded execution recurrence.',
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

  let store = createEmergenceHistoryStore({
    storeId: 'example-history-store',
    createdAtMs: ratification.ratifiedAtMs,
  });
  ({ store } = registerRatifiedEmergence(store, claim, ratification));

  const evaluation = recordPredictionEvaluation(claim, ratification, {
    evaluationId: 'example-evaluation',
    evaluatedBy: 'human-reviewer',
    predictionOutcome: 'supported',
    evaluatedAtMs: 1710008200000,
    outcomeNotes: 'bounded descendant behavior appeared in the expected follow-up window',
  });
  ({ store } = recordHistoricalPredictionEvaluation(store, evaluation));

  const retraction = retractEmergenceClaim(claim, ratification, {
    retractionId: 'example-retraction',
    retractedBy: 'human-reviewer',
    retractedAtMs: 1710009200000,
    retractionBasis: 'ratification_error',
    retractionDetail: 'example-only record to demonstrate bounded retraction sequencing',
  });
  ({ store } = retractHistoricalEmergence(store, retraction));

  const note = createSequenceIntegrityNote(
    claim.claimId,
    'The history store enforces ratification before evaluation and retraction.',
    1710009300000,
  );

  process.stdout.write(
    `${JSON.stringify({ store, entry: getEmergenceHistoryEntry(store, claim.claimId), note }, null, 2)}\n`,
  );
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(message);
    process.exitCode = 1;
  }
}
