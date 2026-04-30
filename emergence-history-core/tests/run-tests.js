const assert = require('node:assert/strict');
const path = require('node:path');

const claimCore = require(path.resolve(
  __dirname,
  '..',
  'node_modules',
  'emergence-claim-core',
  'dist',
  'index.js',
));
const historyCore = require(path.resolve(__dirname, '..', 'dist', 'index.js'));

function test(name, fn) {
  try {
    fn();
    process.stdout.write(`ok - ${name}\n`);
  } catch (error) {
    process.stderr.write(`not ok - ${name}\n`);
    throw error;
  }
}

function createRatifiedBundle() {
  const claim = claimCore.markClaimCandidate(
    claimCore.createEmergenceClaim({
      tier: 'causal_set',
      causalStreamSet: [
        { streamId: 'router_execution', snapshotRef: 'router#window-a' },
        { streamId: 'oracle_window', snapshotRef: 'oracle#window-a' },
      ],
      causalNecessityArguments: [
        {
          streamId: 'router_execution',
          snapshotRef: 'router#window-a',
          necessityArgument: 'execution lane is required',
        },
        {
          streamId: 'oracle_window',
          snapshotRef: 'oracle#window-a',
          necessityArgument: 'oracle posture is required',
        },
      ],
      streamsSampled: [
        { streamId: 'router_execution', snapshotRef: 'router#window-a' },
        { streamId: 'oracle_window', snapshotRef: 'oracle#window-a' },
      ],
      eventWindow: {
        label: 'window-a',
        startTimestampMs: 1710000000000,
        endTimestampMs: 1710003600000,
      },
      candidateEventSummary: 'candidate event summary',
      nonDecomposabilityBasis: 'no single stream explains the event',
      metricEvidence: [
        {
          evidenceId: 'metric-a',
          surface: 'execution_truth',
          ref: 'execution-truth-core#window-a',
          summary: 'bounded execution completed',
        },
      ],
      comprehensionalExplanation: 'cross-stream interaction produced the event',
      falsifiablePrediction: {
        predictionStatement: 'a recognizable descendant appears next window',
        predictionScope: 'agent_behavioral',
        evaluationWindow: {
          label: 'window-b',
          startTimestampMs: 1710003600001,
          endTimestampMs: 1710007200000,
        },
        falsificationCondition: 'no recognizable descendant appears',
        confirmationCondition: 'a recognizable descendant appears',
      },
      observerPackageVersion: '0.2.0',
      substrateSummaryRefs: [
        {
          evidenceId: 'substrate-a',
          surface: 'emergence_observer',
          ref: 'emergence-observer-core#observable',
          summary: 'observable readiness',
        },
      ],
      metricSourceId: 'execution-truth-core',
      narrativeSourceId: 'narrative-core',
      metricGenerationPath: 'execution-truth-core -> window-a aggregation',
      narrativeGenerationPath: 'narrative-core -> explanation synthesis',
      createdBy: 'emergence-observer-core',
    }),
    {
      reason: 'claim advanced for human review',
      changedAtMs: 1710009000000,
    },
  );
  const ratification = claimCore.ratifyEmergenceClaim(claim, {
    ratifiedBy: 'human-reviewer',
    ratifiedAtMs: 1710009001000,
    ratifierJustification: 'evidence clears the causal-set bar',
    falsifiablePredictionEvaluation: 'prediction is explicit and bounded',
    notifiedSurfaces: ['historical_record', 'narrative_read_path'],
  });
  return { claim, ratification };
}

test('history store starts empty and local-analysis-only', () => {
  const store = historyCore.createEmergenceHistoryStore({
    storeId: 'history-store-a',
    createdAtMs: 1710000000000,
  });

  assert.equal(store.localAnalysisOnly, true);
  assert.equal(store.entries.length, 0);
});

test('registering a ratified claim creates a bounded history entry', () => {
  const { claim, ratification } = createRatifiedBundle();
  const store = historyCore.createEmergenceHistoryStore();
  const result = historyCore.registerRatifiedEmergence(store, claim, ratification);

  assert.equal(result.store.entries.length, 1);
  assert.equal(result.record.recordStatus, 'ratified');
  assert.equal(result.record.claim.claimId, claim.claimId);
});

test('history store rejects duplicate registration and unknown sequence updates', () => {
  const { claim, ratification } = createRatifiedBundle();
  let store = historyCore.createEmergenceHistoryStore();
  ({ store } = historyCore.registerRatifiedEmergence(store, claim, ratification));

  assert.throws(
    () => historyCore.registerRatifiedEmergence(store, claim, ratification),
    /already present in the history store/,
  );

  assert.throws(
    () =>
      historyCore.recordHistoricalPredictionEvaluation(store, {
        localAnalysisOnly: true,
        evaluationId: 'unknown-eval',
        claimId: 'missing-claim',
        evaluatedBy: 'human-reviewer',
        evaluatedAtMs: 1710010000000,
        predictionOutcome: 'supported',
      }),
    /is not present in the history store/,
  );

  assert.throws(
    () =>
      historyCore.retractHistoricalEmergence(store, {
        localAnalysisOnly: true,
        retractionId: 'unknown-retraction',
        claimId: 'missing-claim',
        retractedBy: 'human-reviewer',
        retractedAtMs: 1710010001000,
        retractionBasis: 'prediction_falsified',
        retractionDetail: 'missing record',
        notifiedSurfaces: ['historical_record'],
      }),
    /is not present in the history store/,
  );
});

test('prediction evaluation and retraction enforce ordering and single-write behavior', () => {
  const { claim, ratification } = createRatifiedBundle();
  let store = historyCore.createEmergenceHistoryStore();
  ({ store } = historyCore.registerRatifiedEmergence(store, claim, ratification));

  const evaluation = claimCore.recordPredictionEvaluation(claim, ratification, {
    evaluationId: 'eval-a',
    evaluatedBy: 'human-reviewer',
    predictionOutcome: 'falsified',
    evaluatedAtMs: 1710010000000,
    outcomeNotes: 'descendant did not appear',
  });
  ({ store } = historyCore.recordHistoricalPredictionEvaluation(store, evaluation));

  assert.throws(
    () => historyCore.recordHistoricalPredictionEvaluation(store, evaluation),
    /already has a recorded prediction evaluation/,
  );

  const retraction = claimCore.retractEmergenceClaim(claim, ratification, {
    retractionId: 'retraction-a',
    retractedBy: 'human-reviewer',
    retractedAtMs: 1710010001000,
    retractionBasis: 'prediction_falsified',
    retractionDetail: 'prediction failed during the evaluation window',
  });
  const result = historyCore.retractHistoricalEmergence(store, retraction);
  assert.equal(result.record.recordStatus, 'retracted');

  assert.throws(
    () => historyCore.retractHistoricalEmergence(result.store, retraction),
    /already retracted in the history store/,
  );
});

test('history entry lookup returns the bounded assembled view', () => {
  const { claim, ratification } = createRatifiedBundle();
  let store = historyCore.createEmergenceHistoryStore();
  ({ store } = historyCore.registerRatifiedEmergence(store, claim, ratification));

  const entry = historyCore.getEmergenceHistoryEntry(store, claim.claimId);
  assert.equal(entry?.claim.claimId, claim.claimId);
  assert.equal(entry?.ratification.claimId, claim.claimId);
});
