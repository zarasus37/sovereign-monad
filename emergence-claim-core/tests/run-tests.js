const assert = require('node:assert/strict');
const path = require('node:path');

const {
  AGENT_0_GENESIS_PROFILE,
  buildHistoricalEmergenceRecord,
  buildAgentDecision,
  createEmergenceClaim,
  encodeAgentProfile,
  FIRST_ECOSYSTEM_AGENT_PROFILE,
  markClaimCandidate,
  markClaimNotCandidate,
  ratifyEmergenceClaim,
  recordPredictionEvaluation,
  routeCompletePsychometricProfile,
  routeBigFiveProfile,
  stableStringify,
  retractEmergenceClaim,
} = require(path.resolve(__dirname, '..', 'dist', 'index.js'));

function test(name, fn) {
  try {
    fn();
    process.stdout.write(`ok - ${name}\n`);
  } catch (error) {
    process.stderr.write(`not ok - ${name}\n`);
    throw error;
  }
}

function createBaseClaim(overrides = {}) {
  return createEmergenceClaim({
    tier: 'causal_set',
    causalStreamSet: [
      { streamId: 'router_execution', snapshotRef: 'router#window-a' },
      { streamId: 'oracle_window', snapshotRef: 'oracle#window-a' },
    ],
    streamsSampled: [
      { streamId: 'router_execution', snapshotRef: 'router#window-a' },
      { streamId: 'oracle_window', snapshotRef: 'oracle#window-a' },
      { streamId: 'gnosis_window', snapshotRef: 'gnosis#window-a' },
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
    causalNecessityArguments: [
      {
        streamId: 'router_execution',
        snapshotRef: 'router#window-a',
        necessityArgument: 'execution lane is required for the event to exist',
      },
      {
        streamId: 'oracle_window',
        snapshotRef: 'oracle#window-a',
        necessityArgument: 'oracle posture is required to prevent reduction to recurrence',
      },
    ],
    createdBy: 'emergence-observer-core',
    ...overrides,
  });
}

test('claim creation starts as evidence-insufficient and stays local-analysis-only', () => {
  const claim = createBaseClaim();

  assert.equal(claim.localAnalysisOnly, true);
  assert.equal(claim.state, 'evidence_insufficient');
  assert.equal(claim.causalStreamSet.length, 2);
});

test('Agent 0 full profile routing is deterministic and matches expected domains', () => {
  const first = encodeAgentProfile(AGENT_0_GENESIS_PROFILE);
  const second = encodeAgentProfile(AGENT_0_GENESIS_PROFILE);

  assert.equal(first.agentId, '0x995e680959d8547e69ad905c9da415dd9c0dc542e83946da7c5571a6cf19184d');
  assert.equal(first.primaryDomain, 'TRADING');
  assert.equal(first.secondaryDomain, 'GOVERNANCE');
  assert.equal(first.tertiaryDomain, 'DOCTRINE');
  assert.equal(first.routedToGaming, false);
  assert.equal(first.doveMonitoringFlags.elevatedMachiavellianism, true);
  assert.equal(first.doveMonitoringFlags.elevatedNarcissism, true);
  assert.equal(first.doveMonitoringFlags.elevatedPsychopathy, true);
  assert.equal(first.doveMonitoringFlags.anyDoveFlag, true);
  assert.equal(first.agentId, second.agentId);
  assert.equal(first.profileHash, second.profileHash);
  assert.match(first.routeReason, /trading primary selected/);

  assert.deepEqual(
    routeCompletePsychometricProfile(AGENT_0_GENESIS_PROFILE.completeProfile),
    first.completeProfile.routingResult,
  );

  assert.deepEqual(
    routeBigFiveProfile({
      openness: 40,
      conscientiousness: 32,
      extraversion: 82,
      agreeableness: 51,
      neuroticism: 44,
    }),
    {
      domain: 'GAMING',
      reason: 'low conscientiousness plus high extraversion routes away from capital execution and toward high-interaction game environments',
    },
  );

  assert.equal(
    routeBigFiveProfile({
      openness: 52,
      conscientiousness: 72,
      extraversion: 46,
      agreeableness: 82,
      neuroticism: 30,
    }).domain,
    'GOVERNANCE',
  );
});

test('complete profile gaming rule overrides trading when achievement and excitement are low', () => {
  const routed = routeCompletePsychometricProfile({
    createdAtMs: 1770000000000,
    instruments: {
      bigFive: 'test',
      darkTriad: 'test',
      bigFiveReferencePopulation: 'test',
      darkTriadReferencePopulation: 'test',
    },
    domains: {
      openness: 78,
      conscientiousness: 30,
      extraversion: 40,
      agreeableness: 50,
      neuroticism: 35,
    },
    facets: {
      extraversion: {
        friendliness: 40,
        gregariousness: 40,
        assertiveness: 40,
        activityLevel: 40,
        excitementSeeking: 20,
        cheerfulness: 40,
      },
      agreeableness: {
        trust: 50,
        morality: 50,
        altruism: 50,
        cooperation: 50,
        modesty: 50,
        sympathy: 50,
      },
      conscientiousness: {
        selfEfficacy: 30,
        orderliness: 30,
        dutifulness: 30,
        achievementStriving: 20,
        selfDiscipline: 30,
        cautiousness: 30,
      },
      neuroticism: {
        anxiety: 35,
        anger: 35,
        depression: 35,
        selfConsciousness: 35,
        immoderation: 35,
        vulnerability: 35,
      },
      openness: {
        imagination: 78,
        artisticInterests: 78,
        emotionality: 78,
        adventurousness: 78,
        intellect: 78,
        liberalism: 78,
      },
    },
    darkTriad: {
      machiavellianism: { raw: 2, osspPercentile: 30, usAdultsPercentile: 30 },
      narcissism: { raw: 2, osspPercentile: 30, usAdultsPercentile: 30 },
      psychopathy: { raw: 2, osspPercentile: 30, usAdultsPercentile: 30 },
    },
  });

  assert.equal(routed.primaryDomain, 'GAMING');
  assert.equal(routed.routedToGaming, true);
});

test('live agent decision builds a local evidence-only claim without moving funds', () => {
  const routed = encodeAgentProfile(FIRST_ECOSYSTEM_AGENT_PROFILE);
  const decision = buildAgentDecision(routed, {
    chainId: 143,
    blockNumber: 123,
    blockTimestamp: 1770000000,
    gasPriceWei: '108000000000',
    revenueRouter: '0x39158bC2cfCa2cCF70121EF72ed9a5fF1e084982',
    revenueRouterCodeHash: '0x1234',
    market: {
      marketId: 'kuru:MON/USDC:spot',
      address: '0x065C9d28E428A0db40191a54d33d5b7c71a9C394',
      bestBid: 0.031,
      bestAsk: 0.03102,
      midPrice: 0.03101,
      spreadBps: 6.45,
      queryStatus: 'live',
    },
  }, 1770000000000);

  assert.equal(decision.domain, 'TRADING');
  assert.equal(decision.action, 'BUY');
  assert.equal(decision.decisionPayload.proofMode, 'record-only-no-funds-moved');
  assert.equal(decision.localEmergenceClaim.localAnalysisOnly, true);
  assert.equal(decision.localEmergenceClaim.state, 'evidence_insufficient');
  assert.equal(decision.localEmergenceClaim.metricEvidence[0].ref, decision.decisionHash);
});

test('stable stringification is independent of object key order', () => {
  assert.equal(
    stableStringify({ b: 2, a: { d: 4, c: 3 } }),
    stableStringify({ a: { c: 3, d: 4 }, b: 2 }),
  );
});

test('claim creation rejects same-source evidence and undersized causal sets', () => {
  assert.throws(
    () =>
      createBaseClaim({
        metricSourceId: 'shared-source',
        narrativeSourceId: 'shared-source',
      }),
    /metricSourceId and narrativeSourceId must be different/,
  );

  assert.throws(
    () =>
      createBaseClaim({
        causalStreamSet: [{ streamId: 'router_execution', snapshotRef: 'router#window-a' }],
        causalNecessityArguments: [
          {
            streamId: 'router_execution',
            snapshotRef: 'router#window-a',
            necessityArgument: 'only one stream',
          },
        ],
      }),
    /at least two causal streams/,
  );
});

test('claim creation rejects causal streams missing from sampled streams and validates full-field inputs', () => {
  assert.throws(
    () =>
      createBaseClaim({
        streamsSampled: [{ streamId: 'router_execution', snapshotRef: 'router#window-a' }],
      }),
    /must also appear in streamsSampled/,
  );

  const fullFieldClaim = createEmergenceClaim({
    tier: 'full_field',
    activeSubsystemSet: [
      {
        subsystemId: 'oracle-core',
        snapshotRef: 'oracle#window-a',
        outputRef: 'oracle#output-a',
      },
    ],
    streamsSampled: [{ streamId: 'oracle_window', snapshotRef: 'oracle#window-a' }],
    eventWindow: {
      label: 'window-a',
      startTimestampMs: 1710000000000,
      endTimestampMs: 1710003600000,
    },
    candidateEventSummary: 'full-field candidate summary',
    nonDecomposabilityBasis: 'no proper subset explains the event',
    metricEvidence: [
      {
        evidenceId: 'metric-full',
        surface: 'execution_truth',
        ref: 'execution-truth-core#window-a',
        summary: 'bounded execution completed',
      },
    ],
    comprehensionalExplanation: 'full-field explanation',
    falsifiablePrediction: {
      predictionStatement: 'organism-level capability persists next window',
      predictionScope: 'organism_developmental',
      evaluationWindow: {
        label: 'window-b',
        startTimestampMs: 1710003600001,
        endTimestampMs: 1710007200000,
      },
      falsificationCondition: 'capability does not persist',
      confirmationCondition: 'capability persists',
    },
    observerPackageVersion: '0.2.0',
    substrateSummaryRefs: [
      {
        evidenceId: 'substrate-full',
        surface: 'emergence_observer',
        ref: 'emergence-observer-core#observable',
        summary: 'observable readiness',
      },
    ],
    metricSourceId: 'execution-truth-core',
    narrativeSourceId: 'narrative-core',
    metricGenerationPath: 'execution-truth-core -> full-field window aggregation',
    narrativeGenerationPath: 'narrative-core -> full-field explanation synthesis',
    createdBy: 'emergence-observer-core',
  });

  assert.equal(fullFieldClaim.tier, 'full_field');
  assert.equal(fullFieldClaim.state, 'evidence_insufficient');

  assert.throws(
    () =>
      createEmergenceClaim({
        tier: 'full_field',
        activeSubsystemSet: [],
        streamsSampled: [{ streamId: 'oracle_window', snapshotRef: 'oracle#window-a' }],
        eventWindow: {
          label: 'window-a',
          startTimestampMs: 1710000000000,
          endTimestampMs: 1710003600000,
        },
        candidateEventSummary: 'invalid full-field candidate',
        nonDecomposabilityBasis: 'invalid',
        metricEvidence: [
          {
            evidenceId: 'metric-full',
            surface: 'execution_truth',
            ref: 'execution-truth-core#window-a',
            summary: 'bounded execution completed',
          },
        ],
        comprehensionalExplanation: 'invalid full-field explanation',
        falsifiablePrediction: {
          predictionStatement: 'invalid',
          predictionScope: 'organism_developmental',
          evaluationWindow: {
            label: 'window-b',
            startTimestampMs: 1710003600001,
            endTimestampMs: 1710007200000,
          },
          falsificationCondition: 'invalid',
          confirmationCondition: 'invalid',
        },
        observerPackageVersion: '0.2.0',
        substrateSummaryRefs: [
          {
            evidenceId: 'substrate-full',
            surface: 'emergence_observer',
            ref: 'emergence-observer-core#observable',
            summary: 'observable readiness',
          },
        ],
        metricSourceId: 'execution-truth-core',
        narrativeSourceId: 'narrative-core',
        metricGenerationPath: 'execution-truth-core -> full-field window aggregation',
        narrativeGenerationPath: 'narrative-core -> full-field explanation synthesis',
        createdBy: 'emergence-observer-core',
      }),
    /at least one active subsystem snapshot/,
  );
});

test('candidate and not-candidate are terminal evaluation states for the claim object', () => {
  const candidate = markClaimCandidate(createBaseClaim(), {
    reason: 'all structural completeness checks passed',
    changedAtMs: 1710008000000,
  });
  const notCandidate = markClaimNotCandidate(createBaseClaim(), {
    reason: 'single-stream explanation is sufficient',
    changedAtMs: 1710008001000,
  });

  assert.equal(candidate.state, 'candidate');
  assert.equal(notCandidate.state, 'not_candidate');
  assert.throws(
    () =>
      markClaimNotCandidate(candidate, {
        reason: 'should fail',
        changedAtMs: 1710008002000,
      }),
    /Cannot mark claim not-candidate when claim is candidate/,
  );
  assert.throws(
    () =>
      markClaimCandidate(candidate, {
        reason: 'should also fail',
        changedAtMs: 1710008003000,
      }),
    /Cannot mark claim candidate when claim is candidate/,
  );
  assert.throws(
    () =>
      markClaimCandidate(notCandidate, {
        reason: 'should fail',
        changedAtMs: 1710008004000,
      }),
    /Cannot mark claim candidate when claim is not_candidate/,
  );
  assert.throws(
    () =>
      ratifyEmergenceClaim(notCandidate, {
        ratifiedBy: 'human-reviewer',
        ratifierJustification: 'should fail',
        falsifiablePredictionEvaluation: 'should fail',
      }),
    /Cannot ratify claim when claim is not_candidate/,
  );
});

test('ratification is separate from the claim and requires a candidate claim', () => {
  const incompleteClaim = createBaseClaim();
  assert.throws(
    () =>
      ratifyEmergenceClaim(incompleteClaim, {
        ratifiedBy: 'human-reviewer',
        ratifierJustification: 'should fail before candidate',
        falsifiablePredictionEvaluation: 'prediction is bounded',
      }),
    /Cannot ratify claim when claim is evidence_insufficient/,
  );

  const candidate = markClaimCandidate(incompleteClaim, {
    reason: 'claim advanced for human review',
    changedAtMs: 1710009000000,
  });
  const ratification = ratifyEmergenceClaim(candidate, {
    ratificationId: 'ratify-a',
    ratifiedBy: 'human-reviewer',
    ratifiedAtMs: 1710009001000,
    ratifierJustification: 'evidence clears the causal-set bar',
    falsifiablePredictionEvaluation: 'prediction is explicit and bounded',
    notifiedSurfaces: ['historical_record', 'narrative_read_path'],
  });

  assert.equal(candidate.state, 'candidate');
  assert.equal(ratification.claimId, candidate.claimId);
  assert.deepEqual(ratification.notifiedSurfaces, [
    'historical_record',
    'narrative_read_path',
  ]);
  assert.throws(
    () =>
      ratifyEmergenceClaim(candidate, {
        ratifiedBy: 'human-reviewer',
        ratifierJustification: 'invalid notification set',
        falsifiablePredictionEvaluation: 'prediction is explicit and bounded',
        notifiedSurfaces: ['narrative_read_path'],
      }),
    /historical_record notification is required/,
  );
});

test('prediction evaluation and retraction are separate linked records', () => {
  const candidate = markClaimCandidate(createBaseClaim(), {
    reason: 'claim advanced for human review',
  });
  const ratification = ratifyEmergenceClaim(candidate, {
    ratifiedBy: 'human-reviewer',
    ratifierJustification: 'approved',
    falsifiablePredictionEvaluation: 'prediction accepted',
  });

  const evaluation = recordPredictionEvaluation(candidate, ratification, {
    evaluationId: 'eval-a',
    evaluatedBy: 'human-reviewer',
    predictionOutcome: 'falsified',
    evaluatedAtMs: 1710010000000,
    outcomeNotes: 'descendant did not appear in the evaluation window',
  });

  const retraction = retractEmergenceClaim(candidate, ratification, {
    retractedBy: 'human-reviewer',
    retractedAtMs: 1710010001000,
    retractionBasis: 'prediction_falsified',
    retractionDetail: 'the active prediction failed during the evaluation window',
  });

  assert.equal(evaluation.claimId, candidate.claimId);
  assert.equal(evaluation.predictionOutcome, 'falsified');
  assert.equal(retraction.claimId, candidate.claimId);
  assert.deepEqual(retraction.notifiedSurfaces, ['historical_record']);
});

test('historical record is isolated to claim, ratification, and optional evaluation or retraction', () => {
  const candidate = markClaimCandidate(createBaseClaim(), {
    reason: 'claim advanced for human review',
  });
  const ratification = ratifyEmergenceClaim(candidate, {
    ratifiedBy: 'human-reviewer',
    ratifierJustification: 'approved',
    falsifiablePredictionEvaluation: 'prediction accepted',
  });
  const evaluation = recordPredictionEvaluation(candidate, ratification, {
    evaluatedBy: 'human-reviewer',
    predictionOutcome: 'supported',
  });

  const record = buildHistoricalEmergenceRecord(candidate, ratification, evaluation);

  assert.equal(record.localAnalysisOnly, true);
  assert.equal(record.recordStatus, 'ratified');
  assert.deepEqual(record.readableBy, ['historical_record']);
  assert.equal(record.retraction, undefined);
  assert.equal(record.predictionEvaluation?.claimId, candidate.claimId);
});
