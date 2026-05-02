// hepar/tests/stageD.test.ts
// Stage D consensus fusion -- 15 test cases.
// Run: node dist/hepar/tests/stageD.test.js

import { runStageD, runHepar } from '../lib/stages/stageD-consensus';
import type { StageAResult, StageAFinding } from '../lib/stages/stageA-static';
import type { StageBResult, SymbolicInvariantResult } from '../lib/stages/stageB-symbolic';
import type { StageCResult } from '../lib/stages/stageC-montecarlo';
import type { AgentFinding, AgentCampaignResult, AgentId } from '../lib/stages/stageC-utils';

// ---------------------------------------------------------------------------
// Test harness
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    passed++;
    process.stdout.write(`  PASS  ${message}\n`);
  } else {
    failed++;
    process.stderr.write(`  FAIL  ${message}\n`);
  }
}

function assertApprox(
  actual: number,
  expected: number,
  message: string,
  tolerance = 0.0001
): void {
  const ok = Math.abs(actual - expected) <= tolerance;
  if (ok) {
    passed++;
    process.stdout.write(`  PASS  ${message} (${actual.toFixed(6)} ~ ${expected.toFixed(6)})\n`);
  } else {
    failed++;
    process.stderr.write(
      `  FAIL  ${message} (got ${actual.toFixed(6)}, expected ${expected.toFixed(6)})\n`
    );
  }
}

const BAND_RANK: Record<string, number> = {
  ALLOW: 0, GUARDED_ALLOW: 1, RESTRICTED: 2, DENY: 3, HARDBLOCK: 4
};

// ---------------------------------------------------------------------------
// Mock builders
// ---------------------------------------------------------------------------

function makeStageA(opts: {
  hardBlockCandidates?: StageAFinding[];
  byteCodePrivilege?: number;
  proxyAdmin?: number;
  lpUnlock?: number;
  walletTaint?: number;
  accountingInvariant?: number;
  inputValidation?: number;
  walletTaintStatus?: 'PIPELINE_REQUIRED' | 'LIVE';
} = {}): StageAResult {
  const {
    hardBlockCandidates = [],
    byteCodePrivilege = 80,
    proxyAdmin = 80,
    lpUnlock = 80,
    walletTaint = 50,
    accountingInvariant = 100,
    inputValidation = 100,
    walletTaintStatus = 'PIPELINE_REQUIRED'
  } = opts;
  return {
    hardBlockCandidates,
    weightedFindings: [...hardBlockCandidates],
    dimensionScores: {
      byteCodePrivilege, proxyAdmin, lpUnlock, walletTaint,
      accountingInvariant, inputValidation
    },
    dataSourceStatus: { walletTaint: walletTaintStatus },
    stageARunId: 'STAGE-A-MOCK',
    completedAt: Date.now()
  };
}

function makeStageB(opts: {
  hardBlockFromSymbolic?: boolean;
  accountingEscalationPending?: boolean;
  invariantResults?: SymbolicInvariantResult[];
} = {}): StageBResult {
  const {
    hardBlockFromSymbolic = false,
    accountingEscalationPending = false,
    invariantResults = [],
  } = opts;
  return {
    invariantResults,
    summary: {
      provedSafe: invariantResults.filter(r => r.result === 'proved-safe').length,
      counterexamplesFound: invariantResults.filter(r => r.result === 'counterexample-found').length,
      unknownTimeout: invariantResults.filter(r => r.result === 'unknown/timeout').length,
      totalChecked: invariantResults.length
    },
    hardBlockFromSymbolic,
    accountingEscalationPending,
    stageBRunId: 'STAGE-B-MOCK',
    completedAt: Date.now(),
    engineStatus: 'STUB'
  };
}

function makeInvariantResult(
  invariantClass: 'AUTHORIZATION' | 'UPGRADE' | 'ACCOUNTING' | 'REENTRANCY_STATE',
  result: 'proved-safe' | 'counterexample-found' | 'unknown/timeout',
  invariantId = 'INV-MOCK'
): SymbolicInvariantResult {
  const proofterm =
    result === 'counterexample-found' ? 1 :
    result === 'unknown/timeout'      ? 0.5 : 0;
  return {
    invariantClass,
    invariantId,
    description: `Mock invariant ${invariantId} (${invariantClass})`,
    result,
    proofterm: proofterm as 0 | 0.5 | 1,
    counterexample: result === 'counterexample-found' ? ['attacker.call(target)'] : undefined,
    engineStatus: 'STUB'
  };
}

function makeAgentFinding(
  vectorId: string,
  agentId: AgentId,
  severity: number,
  reproScore = 0.8
): AgentFinding {
  return {
    vectorId,
    agentId,
    severity,
    description: `Mock finding ${vectorId} from ${agentId}`,
    exploitPreconditions: ['mock precondition'],
    estLoss: { low: 0, high: 100_000 },
    reproducibilitySeed: `${agentId}-${vectorId}-seed`,
    traceId: `TRACE-${agentId}-${vectorId}`,
    reproScore
  };
}

function makeAgentResult(
  agentId: AgentId,
  findings: AgentFinding[],
  opts: { coverageRatio?: number; unknownRatio?: number } = {}
): AgentCampaignResult {
  return {
    agentId,
    seed: `mock-seed-${agentId}`,
    findings,
    pathsExecuted: 50_000,
    uniqueBranchesHit: 10_000,
    coverageRatio: opts.coverageRatio ?? 0.8,
    unknownRatio:  opts.unknownRatio  ?? 0.1,
    executionStatus: 'STUB',
    completedAt: Date.now()
  };
}

const ALL_AGENT_IDS: AgentId[] = ['PRIVILEGE', 'ARITHMETIC', 'REENTRANCY', 'ECONOMIC', 'STATE'];

function makeStageC(
  agentResults: AgentCampaignResult[],
  overrideFindings?: AgentFinding[]
): StageCResult {
  const allFindings = overrideFindings ??
    agentResults.flatMap(r => r.findings).sort((a, b) => b.severity - a.severity);
  return {
    agentResults,
    allFindings,
    masterSeed: 'mock-master-seed',
    corpusExchangeLog: ['mock corpus exchange'],
    stageCRunId: 'STAGE-C-MOCK',
    completedAt: Date.now(),
    executionStatus: 'STUB',
    totalPathsExecuted: agentResults.reduce((s, r) => s + r.pathsExecuted, 0),
    tierLabel: 'ADVISORY'
  };
}

// Low-severity clean StageCResult: each agent contributes one EDGE_CASE finding, sev=2.
function makeCleanStageC(): StageCResult {
  const agentResults = ALL_AGENT_IDS.map(id =>
    makeAgentResult(id, [makeAgentFinding(`LOW-VEC-${id}`, id, 2)])
  );
  return makeStageC(agentResults);
}

// ---------------------------------------------------------------------------
// Test 1: Clean input -> ALLOW/GUARDED_ALLOW, no hardBlockReasons
// ---------------------------------------------------------------------------
console.log('\nTest 1: Clean input -> ALLOW/GUARDED_ALLOW, hardBlockReasons empty');
{
  const result = runStageD({
    stageAResult: makeStageA(),
    stageBResult: makeStageB(),
    stageCResult: makeCleanStageC(),
    protocolId: 'TEST-PROTO-01',
    codeHash: '0xABCD'
  });

  assert(
    BAND_RANK[result.actionBand] <= BAND_RANK['GUARDED_ALLOW'],
    'T1a: clean input -> ALLOW or GUARDED_ALLOW'
  );
  assert(
    result.hardBlockReasons.length === 0,
    'T1b: hardBlockReasons empty for clean input'
  );
  assert(
    result.tierLabel === 'ADVISORY',
    'T1c: tierLabel is ADVISORY'
  );
}

// ---------------------------------------------------------------------------
// Test 2: Stage A hard-block candidate -> HARDBLOCK regardless of score
// ---------------------------------------------------------------------------
console.log('\nTest 2: Stage A hardBlockCandidates -> HARDBLOCK');
{
  const hardBlockFinding: StageAFinding = {
    surface: 'BYTECODE_PRIVILEGE',
    severity: 9,
    description: 'Unrestricted privileged function detected',
    evidence: ['onlyOwner check absent on withdraw()'],
    hardBlock: true
  };

  const result = runStageD({
    stageAResult: makeStageA({ hardBlockCandidates: [hardBlockFinding] }),
    stageBResult: makeStageB(),
    stageCResult: makeCleanStageC(),
    protocolId: 'TEST-PROTO-02',
    codeHash: '0xABCD'
  });

  assert(
    result.actionBand === 'HARDBLOCK',
    'T2a: Stage A hardBlockCandidates forces HARDBLOCK'
  );
  assert(
    result.hardBlockReasons.length > 0,
    'T2b: hardBlockReasons populated'
  );
  assert(
    result.hardBlockReasons[0]!.includes('Stage A'),
    'T2c: hardBlockReasons[0] references Stage A'
  );
}

// ---------------------------------------------------------------------------
// Test 3: Stage B hardBlockFromSymbolic=true -> HARDBLOCK regardless of score
// ---------------------------------------------------------------------------
console.log('\nTest 3: Stage B hardBlockFromSymbolic -> HARDBLOCK');
{
  const result = runStageD({
    stageAResult: makeStageA(),
    stageBResult: makeStageB({ hardBlockFromSymbolic: true }),
    stageCResult: makeCleanStageC(),
    protocolId: 'TEST-PROTO-03',
    codeHash: '0xABCD'
  });

  assert(
    result.actionBand === 'HARDBLOCK',
    'T3a: hardBlockFromSymbolic forces HARDBLOCK'
  );
  assert(
    result.hardBlockReasons.some(r => r.includes('Stage B')),
    'T3b: hardBlockReasons contains Stage B message'
  );
}

// ---------------------------------------------------------------------------
// Test 4: Stage C CERTAIN + CRITICAL (5/5 agents, sev=9) -> HARDBLOCK
// ---------------------------------------------------------------------------
console.log('\nTest 4: CERTAIN+CRITICAL (5/5, sev=9) -> HARDBLOCK, hardBlockReasons populated');
{
  // All 5 agents independently surface the same critical vector
  const agentResults = ALL_AGENT_IDS.map(id =>
    makeAgentResult(id, [makeAgentFinding('CRITICAL-VEC', id, 9)])
  );
  const stageCResult = makeStageC(agentResults);

  const result = runStageD({
    stageAResult: makeStageA(),
    stageBResult: makeStageB(),
    stageCResult,
    protocolId: 'TEST-PROTO-04',
    codeHash: '0xABCD'
  });

  assert(
    result.actionBand === 'HARDBLOCK',
    'T4a: CERTAIN CRITICAL vector -> HARDBLOCK'
  );
  assert(
    result.hardBlockReasons.length > 0,
    'T4b: hardBlockReasons populated for CERTAIN CRITICAL'
  );
  // The CERTAIN_CRITICAL_HARDBLOCK reason must appear in actionBandResult.reasons
  assert(
    result.actionBandResult.reasons.some(r => r.rule === 'CERTAIN_CRITICAL_HARDBLOCK'),
    'T4c: CERTAIN_CRITICAL_HARDBLOCK escalation rule fired'
  );
}

// ---------------------------------------------------------------------------
// Test 5: Stage C HIGH + HIGH (4/5 agents, sev=7) -> minimum RESTRICTED
// ---------------------------------------------------------------------------
console.log('\nTest 5: HIGH+HIGH (4/5, sev=7) -> minimum RESTRICTED');
{
  // 4 out of 5 agents surface the same HIGH severity vector
  const agentResults = ALL_AGENT_IDS.map((id, i) => {
    const findings = i < 4
      ? [makeAgentFinding('HIGH-VEC', id, 7)]
      : [makeAgentFinding('LOW-OTHER', id, 2)];
    return makeAgentResult(id, findings);
  });
  const stageCResult = makeStageC(agentResults);

  const result = runStageD({
    stageAResult: makeStageA(),
    stageBResult: makeStageB(),
    stageCResult,
    protocolId: 'TEST-PROTO-05',
    codeHash: '0xABCD'
  });

  assert(
    BAND_RANK[result.actionBand] >= BAND_RANK['RESTRICTED'],
    'T5a: HIGH+HIGH vector -> minimum RESTRICTED'
  );
  assert(
    result.actionBandResult.escalated === true,
    'T5b: escalated flag set for HIGH+HIGH'
  );
}

// ---------------------------------------------------------------------------
// Test 6: Multiple PROBABLE vectors -> cortexReviewFlagged=true
// ---------------------------------------------------------------------------
console.log('\nTest 6: Multiple PROBABLE vectors -> cortexReviewFlagged');
{
  // VEC-PROB-1: found by PRIVILEGE, ARITHMETIC, REENTRANCY (3/5 -> PROBABLE)
  // VEC-PROB-2: found by ECONOMIC, STATE, PRIVILEGE      (3/5 -> PROBABLE)
  const privFindings = [
    makeAgentFinding('VEC-PROB-1', 'PRIVILEGE', 5),
    makeAgentFinding('VEC-PROB-2', 'PRIVILEGE', 5)
  ];
  const agentResults: AgentCampaignResult[] = [
    makeAgentResult('PRIVILEGE',  privFindings),
    makeAgentResult('ARITHMETIC', [makeAgentFinding('VEC-PROB-1', 'ARITHMETIC', 5)]),
    makeAgentResult('REENTRANCY', [makeAgentFinding('VEC-PROB-1', 'REENTRANCY', 5)]),
    makeAgentResult('ECONOMIC',   [makeAgentFinding('VEC-PROB-2', 'ECONOMIC', 5)]),
    makeAgentResult('STATE',      [makeAgentFinding('VEC-PROB-2', 'STATE', 5)])
  ];
  const stageCResult = makeStageC(agentResults);

  const result = runStageD({
    stageAResult: makeStageA(),
    stageBResult: makeStageB(),
    stageCResult,
    protocolId: 'TEST-PROTO-06',
    codeHash: '0xABCD'
  });

  assert(
    result.cortexReviewFlagged === true,
    'T6a: multiple PROBABLE vectors -> cortexReviewFlagged'
  );
  assert(
    result.actionBandResult.requiresCortexReview === true,
    'T6b: actionBandResult.requiresCortexReview set'
  );
}

// ---------------------------------------------------------------------------
// Test 7: Stage B CEX on AUTHORIZATION + Stage C PRIVILEGE -> proofterm=1
// ---------------------------------------------------------------------------
console.log('\nTest 7: Stage B CEX AUTHORIZATION + Stage C PRIVILEGE -> proofStatus=counterexample-found');
{
  // PRIVILEGE agent surfaces a vector; AUTHORIZATION CEX maps to PRIVILEGE
  const privFinding = makeAgentFinding('PRIV-VEC-T7', 'PRIVILEGE', 6);
  const agentResults: AgentCampaignResult[] = [
    makeAgentResult('PRIVILEGE',  [privFinding]),
    makeAgentResult('ARITHMETIC', []),
    makeAgentResult('REENTRANCY', []),
    makeAgentResult('ECONOMIC',   []),
    makeAgentResult('STATE',      [])
  ];
  const stageBResult = makeStageB({
    hardBlockFromSymbolic: true,
    invariantResults: [
      makeInvariantResult('AUTHORIZATION', 'counterexample-found', 'AUTH-T7-001')
    ]
  });

  const result = runStageD({
    stageAResult: makeStageA(),
    stageBResult,
    stageCResult: makeStageC(agentResults),
    protocolId: 'TEST-PROTO-07',
    codeHash: '0xABCD'
  });

  const vec = result.findingVectors.find(v => v.vectorId === 'PRIV-VEC-T7');
  assert(
    vec !== undefined,
    'T7a: PRIV-VEC-T7 vector present in findingVectors'
  );
  assert(
    vec?.proofStatus === 'counterexample-found',
    'T7b: proofStatus elevated to counterexample-found by Stage B merge'
  );
  assert(
    (vec?.severity ?? 0) >= 7,
    'T7c: severity bumped to at least STAGE_B_CEX_DEFAULT_SEVERITY (7)'
  );
}

// ---------------------------------------------------------------------------
// Test 8: Stage B proved-safe + Stage C PRIVILEGE -> proofterm=0
// ---------------------------------------------------------------------------
console.log('\nTest 8: Stage B proved-safe AUTHORIZATION + Stage C PRIVILEGE -> proofStatus=proved-safe');
{
  const privFinding = makeAgentFinding('PRIV-VEC-T8', 'PRIVILEGE', 6);
  const agentResults: AgentCampaignResult[] = [
    makeAgentResult('PRIVILEGE',  [privFinding]),
    makeAgentResult('ARITHMETIC', []),
    makeAgentResult('REENTRANCY', []),
    makeAgentResult('ECONOMIC',   []),
    makeAgentResult('STATE',      [])
  ];
  const stageBResult = makeStageB({
    hardBlockFromSymbolic: false,
    invariantResults: [
      makeInvariantResult('AUTHORIZATION', 'proved-safe', 'AUTH-T8-001')
    ]
  });

  const result = runStageD({
    stageAResult: makeStageA(),
    stageBResult,
    stageCResult: makeStageC(agentResults),
    protocolId: 'TEST-PROTO-08',
    codeHash: '0xABCD'
  });

  const vec = result.findingVectors.find(v => v.vectorId === 'PRIV-VEC-T8');
  assert(
    vec?.proofStatus === 'proved-safe',
    'T8a: Stage B proved-safe downgrades vector proofStatus to proved-safe'
  );
  assert(
    result.hardBlockReasons.length === 0,
    'T8b: proved-safe does not trigger hardBlock'
  );
}

// ---------------------------------------------------------------------------
// Test 9: Dimension 9 composite = exact weighted sum
// ---------------------------------------------------------------------------
console.log('\nTest 9: Dimension 9 composite = exact weighted sum (0.17+0.15+0.13+0.17+0.10+0.08+0.12+0.08)');
{
  // Stage A: specific dimension values for Dims 1-4; Dims 5-6 use defaults (100)
  const stageAResult = makeStageA({
    byteCodePrivilege: 80,
    proxyAdmin:        70,
    lpUnlock:          60,
    walletTaint:       50
    // accountingInvariant defaults to 100, inputValidation defaults to 100
  });

  // Stage C: adversarial agents (ARITHMETIC, REENTRANCY, ECONOMIC, STATE) each sev=5
  //          PRIVILEGE finding with sev=3 (not adversarial -> does not affect Dim 7)
  const agentResults: AgentCampaignResult[] = [
    makeAgentResult('PRIVILEGE',  [makeAgentFinding('PRIV-T9',  'PRIVILEGE',  3)]),
    makeAgentResult('ARITHMETIC', [makeAgentFinding('ARITH-T9', 'ARITHMETIC', 5)]),
    makeAgentResult('REENTRANCY', [makeAgentFinding('REENT-T9', 'REENTRANCY', 5)]),
    makeAgentResult('ECONOMIC',   [makeAgentFinding('ECON-T9',  'ECONOMIC',  5)]),
    makeAgentResult('STATE',      [makeAgentFinding('STATE-T9', 'STATE',      5)])
  ];

  // adversarialAvgSeverity = (5+5+5+5)/4 = 5 -> adversarialExecution = max(0, 100-50) = 50
  // maxEconomicSeverity = 5 -> economicViability = max(0, 100-50) = 50
  // composite = 80*0.17 + 70*0.15 + 60*0.13 + 50*0.17 + 100*0.10 + 100*0.08 + 50*0.12 + 50*0.08
  //           = 13.6 + 10.5 + 7.8 + 8.5 + 10.0 + 8.0 + 6.0 + 4.0 = 68.4
  const expectedComposite =
    80 * 0.17 + 70 * 0.15 + 60 * 0.13 + 50 * 0.17 +
    100 * 0.10 + 100 * 0.08 + 50 * 0.12 + 50 * 0.08;

  const result = runStageD({
    stageAResult,
    stageBResult: makeStageB(),
    stageCResult: makeStageC(agentResults),
    protocolId: 'TEST-PROTO-09',
    codeHash: '0xABCD'
  });

  const d = result.dimensionScores;
  assert(d.byteCodePrivilege   === 80,  'T9a: byteCodePrivilege = 80');
  assert(d.proxyAdmin          === 70,  'T9b: proxyAdmin = 70');
  assert(d.lpUnlock            === 60,  'T9c: lpUnlock = 60');
  assert(d.walletTaint         === 50,  'T9d: walletTaint = 50 (provisional)');
  assertApprox(d.adversarialExecution, 50, 'T9e: adversarialExecution = 50');
  assertApprox(d.economicViability,    50, 'T9f: economicViability = 50');
  assertApprox(d.composite, expectedComposite, 'T9g: composite = 68.4');
  assert(d.accountingInvariant === 100, 'T9h: accountingInvariant = 100 (default)');
  assert(d.inputValidation     === 100, 'T9i: inputValidation = 100 (default)');
}

// ---------------------------------------------------------------------------
// Test 10: AttestationPayload signerSet=['ADVISORY_STUB'], Advisory tier
// ---------------------------------------------------------------------------
console.log('\nTest 10: AttestationPayload signerSet and Advisory-tier fields');
{
  const result = runStageD({
    stageAResult: makeStageA(),
    stageBResult: makeStageB(),
    stageCResult: makeCleanStageC(),
    protocolId: 'TEST-PROTO-10',
    codeHash: '0xDEAD'
  });

  const ap = result.attestationPayload;
  assert(
    Array.isArray(ap.signerSet) && ap.signerSet.length === 1,
    'T10a: signerSet has exactly 1 entry'
  );
  assert(
    ap.signerSet[0] === 'ADVISORY_STUB',
    'T10b: signerSet[0] = ADVISORY_STUB'
  );
  assert(
    ap.signerThreshold === 1,
    'T10c: signerThreshold = 1'
  );
  assert(
    !('postedOnChain' in ap),
    'T10d: postedOnChain absent from Advisory AttestationPayload'
  );
}

// ---------------------------------------------------------------------------
// Test 11: uncertaintyPenalty reduces globalScore when coverage low, unknown high
// ---------------------------------------------------------------------------
console.log('\nTest 11: uncertaintyPenalty formula - poor coverage lowers globalScore');
{
  // Single low-severity finding from PRIVILEGE; severity=5, repro=0.7
  // risk(v) = 5*0.55 + 0.2*0.25 + 0.7*0.20 + 0.5 = 2.75+0.05+0.14+0.50 = 3.44
  // Run A: coverageRatio=0.9, unknownRatio=0.05
  //   penalty = (1-0.9)*10 + 0.05*15 = 1.0 + 0.75 = 1.75
  //   globalScore = max(0, 3.44 - 1.75) = 1.69
  // Run B: coverageRatio=0.1, unknownRatio=0.80
  //   penalty = (1-0.1)*10 + 0.80*15 = 9.0 + 12.0 = 21.0
  //   globalScore = max(0, 3.44 - 21.0) = 0

  function makeT11StageC(coverageRatio: number, unknownRatio: number): StageCResult {
    const privFinding = makeAgentFinding('VEC-T11', 'PRIVILEGE', 5, 0.7);
    const agentResults: AgentCampaignResult[] = ALL_AGENT_IDS.map(id =>
      makeAgentResult(id, id === 'PRIVILEGE' ? [privFinding] : [], { coverageRatio, unknownRatio })
    );
    return makeStageC(agentResults, [privFinding]);
  }

  const resultA = runStageD({
    stageAResult: makeStageA(),
    stageBResult: makeStageB(),
    stageCResult: makeT11StageC(0.9, 0.05),
    protocolId: 'TEST-PROTO-11A',
    codeHash: '0xABCD'
  });

  const resultB = runStageD({
    stageAResult: makeStageA(),
    stageBResult: makeStageB(),
    stageCResult: makeT11StageC(0.1, 0.80),
    protocolId: 'TEST-PROTO-11B',
    codeHash: '0xABCD'
  });

  assert(
    resultA.globalScore > resultB.globalScore,
    `T11a: poor coverage lowers globalScore (A=${resultA.globalScore.toFixed(4)}, B=${resultB.globalScore.toFixed(4)})`
  );
  assertApprox(
    resultA.globalScore,
    1.69,
    'T11b: good-coverage globalScore ~ 1.69',
    0.01
  );
  assert(
    resultB.globalScore === 0,
    'T11c: poor-coverage globalScore clamped to 0'
  );
}

// ---------------------------------------------------------------------------
// Test 12: FullHeparRunResult assembles all four stages correctly
// ---------------------------------------------------------------------------
console.log('\nTest 12: runHepar() assembles FullHeparRunResult with all four stages');
{
  const stageA = makeStageA();
  const stageB = makeStageB();
  const stageC = makeCleanStageC();

  const full = runHepar(stageA, stageB, stageC, 'TEST-PROTO-12', '0xBEEF');

  assert(
    typeof full.heparRunId === 'string' && full.heparRunId.length > 0,
    'T12a: heparRunId is a non-empty string'
  );
  assert(
    full.tierLabel === 'ADVISORY',
    'T12b: FullHeparRunResult tierLabel = ADVISORY'
  );
  assert(
    full.stageA === stageA && full.stageB === stageB && full.stageC === stageC,
    'T12c: stageA/B/C references are the original inputs'
  );
  assert(
    full.stageD !== undefined &&
    typeof full.stageD.globalScore === 'number' &&
    full.stageD.tierLabel === 'ADVISORY',
    'T12d: stageD is present and correctly typed'
  );
  assert(
    full.protocolId === 'TEST-PROTO-12',
    'T12e: protocolId propagated into FullHeparRunResult'
  );
}

// ---------------------------------------------------------------------------
// Test 13: ActionBandResult always carries triggeringVectors (SINGLE-SCALAR PROHIBITION)
// ---------------------------------------------------------------------------
console.log('\nTest 13: ActionBandResult.triggeringVectors present (single-scalar prohibition)');
{
  // Use a HIGH+HIGH scenario so triggeringVectors are populated
  const agentResults: AgentCampaignResult[] = ALL_AGENT_IDS.map((id, i) => {
    const findings = i < 4
      ? [makeAgentFinding('HIGH-VEC-T13', id, 7)]
      : [makeAgentFinding('LOW-OTHER-T13', id, 2)];
    return makeAgentResult(id, findings);
  });

  const result = runStageD({
    stageAResult: makeStageA(),
    stageBResult: makeStageB(),
    stageCResult: makeStageC(agentResults),
    protocolId: 'TEST-PROTO-13',
    codeHash: '0xABCD'
  });

  assert(
    Array.isArray(result.actionBandResult.triggeringVectors),
    'T13a: triggeringVectors is an Array'
  );
  assert(
    result.actionBandResult.triggeringVectors.length > 0,
    'T13b: triggeringVectors non-empty for escalated result'
  );
  assert(
    result.actionBand === result.actionBandResult.band,
    'T13c: actionBand === actionBandResult.band (field consistency)'
  );
}

// ---------------------------------------------------------------------------
// Test 14: walletTaint provisional when dataSourceStatus=PIPELINE_REQUIRED
// ---------------------------------------------------------------------------
console.log('\nTest 14: walletTaintProvisional flag from dataSourceStatus');
{
  const resultPipeline = runStageD({
    stageAResult: makeStageA({ walletTaintStatus: 'PIPELINE_REQUIRED' }),
    stageBResult: makeStageB(),
    stageCResult: makeCleanStageC(),
    protocolId: 'TEST-PROTO-14A',
    codeHash: '0xABCD'
  });
  assert(
    resultPipeline.walletTaintProvisional === true,
    'T14a: PIPELINE_REQUIRED -> walletTaintProvisional = true'
  );

  const resultLive = runStageD({
    stageAResult: makeStageA({ walletTaintStatus: 'LIVE' }),
    stageBResult: makeStageB(),
    stageCResult: makeCleanStageC(),
    protocolId: 'TEST-PROTO-14B',
    codeHash: '0xABCD'
  });
  assert(
    resultLive.walletTaintProvisional === false,
    'T14b: LIVE -> walletTaintProvisional = false'
  );
}

// ---------------------------------------------------------------------------
// Test 15: New Stage A surfaces (accountingInvariant, inputValidation) appear
//          in StageDDimensionScores and contribute to the composite correctly
// ---------------------------------------------------------------------------
console.log('\nTest 15: accountingInvariant and inputValidation surfaces flow through Stage D');
{
  const stageAResult = makeStageA({
    accountingInvariant: 70,
    inputValidation:     85,
    byteCodePrivilege:   80,
    proxyAdmin:          80,
    lpUnlock:            80,
    walletTaint:         50
  });

  const result = runStageD({
    stageAResult,
    stageBResult: makeStageB(),
    stageCResult: makeCleanStageC(),
    protocolId: 'TEST-PROTO-15',
    codeHash: '0xABCD'
  });

  const d = result.dimensionScores;
  assert(
    d.accountingInvariant === 70,
    'T15a: accountingInvariant = 70 passed through from Stage A'
  );
  assert(
    d.inputValidation === 85,
    'T15b: inputValidation = 85 passed through from Stage A'
  );
  // Verify composite reflects the new values
  // adversarialExecution and economicViability will be low (sev=2 each from makeCleanStageC)
  // adversarialAvgSeverity = 2, -> adversarialExecution = 80; maxEconSeverity = 2 -> economicViability = 80
  const expectedComposite15 =
    80 * 0.17 + 80 * 0.15 + 80 * 0.13 + 50 * 0.17 +
    70 * 0.10 + 85 * 0.08 + 80 * 0.12 + 80 * 0.08;
  assertApprox(
    d.composite,
    expectedComposite15,
    `T15c: composite reflects accountingInvariant=70 and inputValidation=85`,
    0.01
  );
}

// ---------------------------------------------------------------------------
// Test 16: PROBABLE+CRITICAL vector (3/5 agents, sev=9) -> RESTRICTED via
//          PROBABLE_CRITICAL_RESTRICT escalation rule (CAL-003 gap closure)
// ---------------------------------------------------------------------------
console.log('\nTest 16: PROBABLE+CRITICAL (3/5, sev=9) -> RESTRICTED via PROBABLE_CRITICAL_RESTRICT');
{
  // 3 agents find 'PROB-CRIT-T16' at sev=9; 2 agents find different low-sev vectors
  const agentResults: AgentCampaignResult[] = [
    makeAgentResult('ARITHMETIC', [makeAgentFinding('PROB-CRIT-T16', 'ARITHMETIC', 9)]),
    makeAgentResult('ECONOMIC',   [makeAgentFinding('PROB-CRIT-T16', 'ECONOMIC',   9)]),
    makeAgentResult('STATE',      [makeAgentFinding('PROB-CRIT-T16', 'STATE',      9)]),
    makeAgentResult('PRIVILEGE',  [makeAgentFinding('PRIV-T16-LOW',  'PRIVILEGE',  3)]),
    makeAgentResult('REENTRANCY', [makeAgentFinding('REENT-T16-LOW', 'REENTRANCY', 3)]),
  ];
  // PROB-CRIT-T16: agentsFound=3, totalAgents=5 -> ratio=0.60 -> PROBABLE + sev=9 -> CRITICAL
  const result = runStageD({
    stageAResult: makeStageA(),
    stageBResult: makeStageB(),
    stageCResult: makeStageC(agentResults),
    protocolId:   'TEST-PROTO-16',
    codeHash:     '0xABCD'
  });

  assert(
    result.actionBand === 'RESTRICTED',
    'T16a: PROBABLE+CRITICAL vector -> minimum RESTRICTED band'
  );
  assert(
    result.actionBandResult.reasons.some(r => r.rule === 'PROBABLE_CRITICAL_RESTRICT'),
    'T16b: PROBABLE_CRITICAL_RESTRICT escalation rule fired'
  );
  assert(
    result.actionBandResult.triggeringVectors.some(v => v.vectorId === 'PROB-CRIT-T16'),
    'T16c: triggeringVectors contains PROB-CRIT-T16'
  );
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log('\n---------------------------------------------------');
console.log(`Stage D Tests: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
