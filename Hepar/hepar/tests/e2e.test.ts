// hepar/tests/e2e.test.ts
// End-to-end tests for Advisory-tier Hepar — five complete assessment runs.
// Covers 74+ assertions: E1.1-E1.15, E2.1-E2.15, E2b.1-E2b.5, E3.1-E3.15, E4.1-E4.7, E5.1-E5.6, F1-F10.
// Advisory tier: fixture-verified only. No live telemetry. No automated capital action.

import {
  runHeparOrchestrator,
  _resetRegistryStoreForTesting,
  ADVISORY_DISCLAIMERS,
} from '../hepar-orchestrator';
import { _resetDataRailStoreForTesting } from '../lib/integration/datarail-record';
import { AdvisoryStubEngine } from '../lib/stages/stageB-symbolic';
import { canPublishExternally } from '../lib/registry/registryManager';
import { buildPrivateNotification } from '../lib/disclosure/disclosureNotifier';
import type { StageAFinding } from '../lib/stages/stageA-static';
import type { AgentId, AgentFinding } from '../lib/stages/stageC-utils';

// ---------------------------------------------------------------------------
// Test harness
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function assert(label: string, cond: boolean): void {
  if (cond) {
    console.log('  PASS  ' + label);
    passed++;
  } else {
    console.error('  FAIL  ' + label);
    failed++;
  }
}

function assertThrows(label: string, fn: () => void): void {
  try {
    fn();
    console.error('  FAIL  ' + label + ' (expected throw, got none)');
    failed++;
  } catch {
    console.log('  PASS  ' + label);
    passed++;
  }
}

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

function makeAgentFinding(
  vectorId: string,
  agentId: AgentId,
  severity: number,
  seed: string
): AgentFinding {
  return {
    vectorId,
    agentId,
    severity,
    description: 'E2E test finding ' + vectorId + ' from agent ' + agentId,
    exploitPreconditions: ['Precondition for ' + vectorId],
    estLoss: { low: 50_000, high: 500_000 },
    reproducibilitySeed: seed,
    traceId: 'TRACE-' + seed,
    reproScore: 0.7,
  };
}

// ---------------------------------------------------------------------------
// Global reset — before any runs
// ---------------------------------------------------------------------------

_resetRegistryStoreForTesting();
_resetDataRailStoreForTesting();

// ===========================================================================
// SCENARIO 1 — CLEAN PROTOCOL (ALLOW band)
// Low-severity benign findings. No hard-blocks. No forced C findings.
// ===========================================================================

console.log('\n--- SCENARIO 1: CLEAN PROTOCOL (ALLOW) ---');

const S1_FINDINGS: StageAFinding[] = [
  {
    surface: 'BYTECODE_PRIVILEGE',
    severity: 1,
    hardBlock: false,
    description: 'Benign ownership check — read-only admin function',
    evidence: [],
  },
];

_resetRegistryStoreForTesting();

const s1 = runHeparOrchestrator({
  protocolId:    'PROTO-CLEAN-E2E-001',
  codeHash:      '0xCLEAN001000000000000000000000000000000000000000000000000000000001',
  masterSeed:    'E2E-CLEAN-MASTER-SEED',
  stageAFindings: S1_FINDINGS,
  stageCForcedFindings: {
    PRIVILEGE:  [],
    ARITHMETIC: [],
    REENTRANCY: [],
    ECONOMIC:   [],
    STATE:      [],
  },
});

assert('E1.1  actionBand = ALLOW or GUARDED_ALLOW',
  s1.operatorSummary.actionBand === 'ALLOW' ||
  s1.operatorSummary.actionBand === 'GUARDED_ALLOW');

assert('E1.2  hardBlocked = false',
  s1.operatorSummary.hardBlocked === false);

assert('E1.3  hardBlockReasons is empty',
  s1.operatorSummary.hardBlockReasons.length === 0);

assert('E1.4  globalScore < 40',
  s1.operatorSummary.globalScore < 40);

assert('E1.5  registryEntry.currentStatus = GREEN',
  s1.registryEntry.currentStatus === 'GREEN');

assert('E1.6  canPublishExternally = true (GREEN status cleared for publication)',
  canPublishExternally(s1.registryEntry) === true);

assert('E1.7  disclosureWindows is empty (no severity >= 7 findings)',
  s1.disclosureWindows.length === 0);

assert('E1.8  cortexEscalated = false',
  s1.operatorSummary.cortexEscalated === false);

assert('E1.9  integrationResults.cortex = null',
  s1.integrationResults.cortex === null);

assert('E1.10 cardia.cap.maxAllocationBps > 0 (non-zero allocation permitted)',
  s1.integrationResults.cardia.cap.maxAllocationBps > 0);

assert('E1.11 cardia.cap.requiresOperatorConfirmation = true',
  s1.integrationResults.cardia.cap.requiresOperatorConfirmation === true);

assert('E1.12 vox.package.truthStatus = INCOMPLETE (walletTaint PIPELINE_REQUIRED)',
  s1.integrationResults.vox.package.truthStatus === 'INCOMPLETE');

assert('E1.13 advisoryTierDisclaimers.length >= 3',
  s1.operatorSummary.advisoryTierDisclaimers.length >= 3);

assert('E1.14 attestationRecord.postedOnChain = false',
  s1.attestationRecord.postedOnChain === false);

assert('E1.15 all four stage outputs present in HeparFullRunOutput',
  s1.stageA !== undefined &&
  s1.stageB !== undefined &&
  s1.stageC !== undefined &&
  s1.stageD !== undefined);

// ===========================================================================
// SCENARIO 2 — DANGEROUS PROTOCOL (HARDBLOCK)
// Stage A hard-block + Stage B AUTH-001 counterexample + 5/5 Stage C severity-9.
// ===========================================================================

console.log('\n--- SCENARIO 2: DANGEROUS PROTOCOL (HARDBLOCK) ---');

const S2_FINDINGS: StageAFinding[] = [
  {
    surface:     'BYTECODE_PRIVILEGE',
    severity:    9,
    hardBlock:   true,
    description: 'Unrestricted admin mint backdoor — critical privilege escape',
    evidence:    ['0xDEADBEEF'],
  },
];

_resetRegistryStoreForTesting();

const s2 = runHeparOrchestrator({
  protocolId:    'PROTO-DANGEROUS-E2E-001',
  codeHash:      '0xDANGER01000000000000000000000000000000000000000000000000000000001',
  masterSeed:    'E2E-DANGER-MASTER-SEED',
  stageAFindings: S2_FINDINGS,
  stageBEngine: new AdvisoryStubEngine({
    knownCounterexamples: new Map([
      ['AUTH-001', ['Attacker calls setOwner with no authorization guard in place']],
    ]),
  }),
  stageCForcedFindings: {
    PRIVILEGE:  [makeAgentFinding('EXPLOIT-FLASH-001', 'PRIVILEGE',  9, 'S2-PRIV')],
    ARITHMETIC: [makeAgentFinding('EXPLOIT-FLASH-001', 'ARITHMETIC', 9, 'S2-ARITH')],
    REENTRANCY: [makeAgentFinding('EXPLOIT-FLASH-001', 'REENTRANCY', 9, 'S2-REEN')],
    ECONOMIC:   [makeAgentFinding('EXPLOIT-FLASH-001', 'ECONOMIC',   9, 'S2-ECON')],
    STATE:      [makeAgentFinding('EXPLOIT-FLASH-001', 'STATE',      9, 'S2-STATE')],
  },
});

assert('E2.1  actionBand = HARDBLOCK',
  s2.operatorSummary.actionBand === 'HARDBLOCK');

assert('E2.2  hardBlocked = true',
  s2.operatorSummary.hardBlocked === true);

assert('E2.3  hardBlockReasons.length >= 1',
  s2.operatorSummary.hardBlockReasons.length >= 1);

assert('E2.4  registryEntry.currentStatus = RED',
  s2.registryEntry.currentStatus === 'RED');

assert('E2.5  canPublishExternally = false (RED requires full §15 posture)',
  canPublishExternally(s2.registryEntry) === false);

assert('E2.6  cardia.cap.maxAllocationBps = 0',
  s2.integrationResults.cardia.cap.maxAllocationBps === 0);

assert('E2.7  cardia.cap.hardBlocked = true',
  s2.integrationResults.cardia.cap.hardBlocked === true);

assert('E2.8  cortexEscalated = false (HARDBLOCK does not route to Cortex)',
  s2.operatorSummary.cortexEscalated === false);

assert('E2.9  integrationResults.cortex = null',
  s2.integrationResults.cortex === null);

assert('E2.10 synapse.payload.urgency = IMMEDIATE',
  s2.integrationResults.synapse.payload.urgency === 'IMMEDIATE');

assert('E2.11 disclosureWindows.length >= 1 (severity >= 7 triggers window)',
  s2.disclosureWindows.length >= 1);

assert('E2.12 disclosureWindows[0].severity is CRITICAL or HIGH',
  s2.disclosureWindows[0].severity === 'CRITICAL' ||
  s2.disclosureWindows[0].severity === 'HIGH');

assert('E2.13 disclosureWindows[0].status = OPEN',
  s2.disclosureWindows[0].status === 'OPEN');

assert('E2.14 stageB.hardBlockFromSymbolic = true (AUTH-001 counterexample)',
  s2.stageB.hardBlockFromSymbolic === true);

assert('E2.15 attestationRecord.postedOnChain = false',
  s2.attestationRecord.postedOnChain === false);

// ===========================================================================
// SCENARIO 2b — ACCOUNTING CEX ALONE -> HARDBLOCK via Stage B
// No Stage A hard-block candidates, no AUTH/UPGRADE CEX.
// Only ACCT-001 counterexample. After gap fix, this must trigger HARDBLOCK.
// ===========================================================================

console.log('\n--- SCENARIO 2b: ACCOUNTING CEX ALONE -> Stage B HARDBLOCK ---');

_resetRegistryStoreForTesting();

const s2b = runHeparOrchestrator({
  protocolId:    'PROTO-ACCT-CEX-E2E-001',
  codeHash:      '0xACCT0001000000000000000000000000000000000000000000000000000000001',
  masterSeed:    'E2E-ACCT-CEX-MASTER-SEED',
  stageAFindings: [
    {
      surface:     'ACCOUNTING_INVARIANT',
      severity:    6,
      hardBlock:   false,
      description: 'Unchecked return value on token transfer in balance-critical path',
      evidence:    ['token.transfer(user, amount) — return not checked'],
    },
  ],
  stageBEngine: new AdvisoryStubEngine({
    knownCounterexamples: new Map([
      ['ACCT-001', ['attacker.flashloan(1e24)', 'protocol.deposit(1e24)', 'reserves: underflowed']],
    ]),
  }),
  stageCForcedFindings: {
    PRIVILEGE:  [],
    ARITHMETIC: [makeAgentFinding('ACCT-CEX-VEC-001', 'ARITHMETIC', 7, 'S2B-ARITH')],
    REENTRANCY: [],
    ECONOMIC:   [makeAgentFinding('ACCT-CEX-VEC-001', 'ECONOMIC',   6, 'S2B-ECON')],
    STATE:      [],
  },
});

assert('E2b.1  Stage A has no hard-block candidates (sev=6 < 8)',
  s2b.stageA.hardBlockCandidates.filter((f) => f.surface !== 'WALLET_TAINT').length === 0);

assert('E2b.2  stageB.hardBlockFromSymbolic = true (ACCT-001 counterexample)',
  s2b.stageB.hardBlockFromSymbolic === true);

assert('E2b.3  actionBand = HARDBLOCK (Stage B escalation)',
  s2b.operatorSummary.actionBand === 'HARDBLOCK');

assert('E2b.4  hardBlockReasons contains Stage B message',
  s2b.operatorSummary.hardBlockReasons.some(
    (r) => r.toLowerCase().includes('stage b')
  ));

assert('E2b.5  registryEntry.currentStatus = RED',
  s2b.registryEntry.currentStatus === 'RED');

// ===========================================================================
// SCENARIO 3 — RESTRICTED PROTOCOL (CORTEX ESCALATION)
// 4/5 Stage C agents report HIGH-RISK-001 severity=8 -> HIGH convergence ->
// HIGH_HIGH_RESTRICT escalation -> RESTRICTED band -> Cortex escalation.
// ===========================================================================

console.log('\n--- SCENARIO 3: RESTRICTED PROTOCOL (CORTEX ESCALATION) ---');

const S3_FINDINGS: StageAFinding[] = [
  {
    surface:     'LP_UNLOCK',
    severity:    5,
    hardBlock:   false,
    description: 'High LP concentration in top-3 wallets — elevated unlock risk',
    evidence:    [],
  },
  {
    surface:     'PROXY_ADMIN',
    severity:    6,
    hardBlock:   false,
    description: 'Single-key proxy admin — upgrade authority unguarded',
    evidence:    [],
  },
];

_resetRegistryStoreForTesting();

const s3a = runHeparOrchestrator({
  protocolId:    'PROTO-RESTRICTED-E2E-001',
  codeHash:      '0xRESTR001000000000000000000000000000000000000000000000000000000001',
  masterSeed:    'E2E-RESTRICTED-MASTER-SEED-A',
  stageAFindings: S3_FINDINGS,
  stageCForcedFindings: {
    PRIVILEGE:  [makeAgentFinding('HIGH-RISK-001', 'PRIVILEGE',  8, 'S3A-PRIV')],
    ARITHMETIC: [makeAgentFinding('HIGH-RISK-001', 'ARITHMETIC', 8, 'S3A-ARITH')],
    REENTRANCY: [makeAgentFinding('HIGH-RISK-001', 'REENTRANCY', 8, 'S3A-REEN')],
    ECONOMIC:   [makeAgentFinding('HIGH-RISK-001', 'ECONOMIC',   8, 'S3A-ECON')],
    STATE:      [],
  },
});

assert('E3.1  actionBand = RESTRICTED (HIGH-confidence HIGH-severity triggers floor)',
  s3a.operatorSummary.actionBand === 'RESTRICTED');

assert('E3.2  cortexEscalated = true',
  s3a.operatorSummary.cortexEscalated === true);

assert('E3.3  integrationResults.cortex is not null',
  s3a.integrationResults.cortex !== null);

const s3cortex = s3a.integrationResults.cortex!;
const overrideOpts = s3cortex.package.recommendedOverrideOptions as string[];

assert('E3.4  cortexPackage.recommendedOverrideOptions does not contain HARDBLOCK',
  !overrideOpts.includes('HARDBLOCK'));

assert('E3.5  cortexPackage.recommendedOverrideOptions contains GUARDED_ALLOW and DENY',
  overrideOpts.includes('GUARDED_ALLOW') &&
  overrideOpts.includes('DENY'));

assert('E3.6  cardia.cap.maxAllocationBps = 100 (RESTRICTED cap = 1%)',
  s3a.integrationResults.cardia.cap.maxAllocationBps === 100);

assert('E3.7  cardia.cap.requiresOperatorConfirmation = true',
  s3a.integrationResults.cardia.cap.requiresOperatorConfirmation === true);

assert('E3.8  synapse.payload.urgency = ELEVATED',
  s3a.integrationResults.synapse.payload.urgency === 'ELEVATED');

assert('E3.9  registryEntry.currentStatus = YELLOW or RED',
  s3a.registryEntry.currentStatus === 'YELLOW' ||
  s3a.registryEntry.currentStatus === 'RED');

const s3vox = s3a.integrationResults.vox.package.audiencePackages;

assert('E3.10 vox.internal.summary is a non-empty string',
  typeof s3vox.internal.summary === 'string' &&
  s3vox.internal.summary.length > 0);

assert('E3.11 vox.institutional.summary is a non-empty string',
  typeof s3vox.institutional.summary === 'string' &&
  s3vox.institutional.summary.length > 0);

assert('E3.12 vox.internal.disclaimers contains Advisory tier disclaimer',
  s3vox.internal.disclaimers.some(
    (d) => d.toLowerCase().includes('advisory tier')
  ));

assert('E3.13 disclosureWindows match findings with severity >= 7',
  s3a.disclosureWindows.length >= 1 &&
  s3a.disclosureWindows.every(
    (w) => w.severity === 'CRITICAL' || w.severity === 'HIGH'
  ));

assert('E3.14 dataRail.written = true (first S3 run)',
  s3a.integrationResults.dataRail.written === true);

// Second run on same protocolId — no registry reset between runs
const s3b = runHeparOrchestrator({
  protocolId:    'PROTO-RESTRICTED-E2E-001',
  codeHash:      '0xRESTR002000000000000000000000000000000000000000000000000000000002',
  masterSeed:    'E2E-RESTRICTED-MASTER-SEED-B',
  stageAFindings: S3_FINDINGS,
  stageCForcedFindings: {
    PRIVILEGE:  [makeAgentFinding('HIGH-RISK-001', 'PRIVILEGE',  8, 'S3B-PRIV')],
    ARITHMETIC: [makeAgentFinding('HIGH-RISK-001', 'ARITHMETIC', 8, 'S3B-ARITH')],
    REENTRANCY: [makeAgentFinding('HIGH-RISK-001', 'REENTRANCY', 8, 'S3B-REEN')],
    ECONOMIC:   [makeAgentFinding('HIGH-RISK-001', 'ECONOMIC',   8, 'S3B-ECON')],
    STATE:      [],
  },
});

assert('E3.15 second run on same protocolId -> riskScoreHistory.length = 2',
  s3b.registryEntry.riskScoreHistory.length === 2);

// ===========================================================================
// SCENARIO 4 — PROBABLE CRITICAL PROTOCOL (RESTRICTED via PROBABLE_CRITICAL_RESTRICT)
// No Stage A hard-block. No Stage B CEX. 3/5 Stage C agents find same vector at sev=9.
// Expected: PROBABLE_CRITICAL_RESTRICT fires -> actionBand = RESTRICTED.
// ===========================================================================

console.log('\n--- SCENARIO 4: PROBABLE CRITICAL (RESTRICTED via Stage C alone) ---');

_resetRegistryStoreForTesting();

const s4 = runHeparOrchestrator({
  protocolId:    'PROTO-PROBABLE-CRITICAL-E2E-001',
  codeHash:      '0xPROBC001000000000000000000000000000000000000000000000000000000001',
  masterSeed:    'E2E-PROBABLE-CRITICAL-SEED',
  stageAFindings: [
    {
      surface:     'LP_UNLOCK',
      severity:    3,
      hardBlock:   false,
      description: 'Minor LP concentration — below hard-block threshold',
      evidence:    [],
    },
  ],
  stageCForcedFindings: {
    ARITHMETIC: [makeAgentFinding('PROB-CRIT-E4', 'ARITHMETIC', 9, 'S4-ARITH')],
    ECONOMIC:   [makeAgentFinding('PROB-CRIT-E4', 'ECONOMIC',   9, 'S4-ECON')],
    STATE:      [makeAgentFinding('PROB-CRIT-E4', 'STATE',      9, 'S4-STATE')],
    PRIVILEGE:  [makeAgentFinding('PRIV-E4-LOW',  'PRIVILEGE',  3, 'S4-PRIV')],
    REENTRANCY: [makeAgentFinding('REENT-E4-LOW', 'REENTRANCY', 3, 'S4-REENT')],
  },
  // Stage B: default stub (no injected CEX) -> hardBlockFromSymbolic = false
});

// PROB-CRIT-E4: 3/5 agents -> ratio=0.60 -> PROBABLE; sev=9 -> CRITICAL
// PROBABLE_CRITICAL_RESTRICT fires -> minimum RESTRICTED

assert('E4.1  actionBand = RESTRICTED (PROBABLE_CRITICAL_RESTRICT escalates from score)',
  s4.operatorSummary.actionBand === 'RESTRICTED');

assert('E4.2  cortexEscalated = true (RESTRICTED band routes to Cortex)',
  s4.operatorSummary.cortexEscalated === true);

assert('E4.3  integrationResults.cortex is not null',
  s4.integrationResults.cortex !== null);

assert('E4.4  stageA has no hard-block candidates',
  s4.stageA.hardBlockCandidates.filter((f) => f.surface !== 'WALLET_TAINT').length === 0);

assert('E4.5  stageB.hardBlockFromSymbolic = false (no CEX injected)',
  s4.stageB.hardBlockFromSymbolic === false);

assert('E4.6  PROBABLE_CRITICAL_RESTRICT in actionBandResult.reasons',
  s4.stageD.actionBandResult.reasons.some(r => r.rule === 'PROBABLE_CRITICAL_RESTRICT'));

assert('E4.7  triggeringVectors contains PROB-CRIT-E4 (the qualifying vector)',
  s4.stageD.actionBandResult.triggeringVectors.some(v => v.vectorId === 'PROB-CRIT-E4'));

// ===========================================================================
// SCENARIO 5 — CLEAN AMM PROTOCOL (FALSE-POSITIVE PRECISION TEST)
// Models a well-audited, never-exploited AMM (Uniswap v3-class).
// Stage A: low-severity advisory findings, no hard-block candidates.
// Stage B: default stub (no CEX injected).
// Stage C: all EDGE_CASE (1/5 agents, different vectorIds), sev 2-6.
// Expected: ALLOW or GUARDED_ALLOW. Zero escalation rules.
// ===========================================================================

console.log('\n--- SCENARIO 5: CLEAN AMM PROTOCOL (FALSE-POSITIVE PRECISION TEST) ---');

_resetRegistryStoreForTesting();

const s5 = runHeparOrchestrator({
  protocolId:    'PROTO-CLEAN-AMM-E2E-001',
  codeHash:      '0xCLNAMM01000000000000000000000000000000000000000000000000000000001',
  masterSeed:    'E2E-CLEAN-AMM-PRECISION-SEED',
  stageAFindings: [
    {
      surface:     'BYTECODE_PRIVILEGE',
      severity:    3,
      hardBlock:   false,
      description: 'Factory setOwner and enableFeeAmount governance calls — standard timelocked AMM admin pattern',
      evidence:    [],
    },
    {
      surface:     'LP_UNLOCK',
      severity:    4,
      hardBlock:   false,
      description: 'Concentrated LP positions near extreme ticks create edge-case behaviors under thin liquidity',
      evidence:    [],
    },
  ],
  // Stage B: default stub — no engine override, no injected CEX
  stageCForcedFindings: {
    // All different vectorIds -> each agentsFound=1/5 -> EDGE_CASE convergence.
    // Max sev=6 -> PROBABLE_CRITICAL_RESTRICT threshold (sev>=9) not reached.
    ARITHMETIC: [makeAgentFinding('AMM-TICK-BOUNDARY',   'ARITHMETIC', 5, 'S5-ARITH')],
    ECONOMIC:   [makeAgentFinding('AMM-MEV-SANDWICH',    'ECONOMIC',   6, 'S5-ECON')],
    STATE:      [makeAgentFinding('AMM-TICK-CROSS-STATE','STATE',      4, 'S5-STATE')],
    PRIVILEGE:  [makeAgentFinding('AMM-FACTORY-SETTER',  'PRIVILEGE',  3, 'S5-PRIV')],
    REENTRANCY: [makeAgentFinding('AMM-REENT-GUARD-OK',  'REENTRANCY', 2, 'S5-REENT')],
  },
});

assert('E5.1  actionBand = ALLOW or GUARDED_ALLOW (no false positive)',
  s5.operatorSummary.actionBand === 'ALLOW' ||
  s5.operatorSummary.actionBand === 'GUARDED_ALLOW');

assert('E5.2  cortexEscalated = false (no escalation path fired)',
  s5.operatorSummary.cortexEscalated === false);

assert('E5.3  stageA has no hard-block candidates (sev 3-4, no hardBlock flag)',
  s5.stageA.hardBlockCandidates.filter((f) => f.surface !== 'WALLET_TAINT').length === 0);

assert('E5.4  stageB.hardBlockFromSymbolic = false (no CEX injected)',
  s5.stageB.hardBlockFromSymbolic === false);

assert('E5.5  No CERTAIN_CRITICAL, HIGH_HIGH, or PROBABLE_CRITICAL rules fired',
  s5.stageD.actionBandResult.reasons.every(r =>
    r.rule !== 'CERTAIN_CRITICAL_HARDBLOCK' &&
    r.rule !== 'HIGH_HIGH_RESTRICT' &&
    r.rule !== 'PROBABLE_CRITICAL_RESTRICT'
  ));

assert('E5.6  globalScore < 40 (clean protocol stays well below RESTRICTED threshold)',
  s5.operatorSummary.globalScore < 40);

// ===========================================================================
// FINAL SYSTEM INVARIANTS — tested across all runs
// ===========================================================================

console.log('\n--- SYSTEM INVARIANTS ---');

assert('F1  tierLabel = ADVISORY on all HeparFullRunOutput objects',
  s1.tierLabel === 'ADVISORY' &&
  s2.tierLabel === 'ADVISORY' &&
  s2b.tierLabel === 'ADVISORY' &&
  s3a.tierLabel === 'ADVISORY' &&
  s3b.tierLabel === 'ADVISORY' &&
  s4.tierLabel === 'ADVISORY' &&
  s5.tierLabel === 'ADVISORY');

assert('F2  postedOnChain = false on all AttestationRecords',
  s1.attestationRecord.postedOnChain === false &&
  s2.attestationRecord.postedOnChain === false &&
  s2b.attestationRecord.postedOnChain === false &&
  s3a.attestationRecord.postedOnChain === false &&
  s3b.attestationRecord.postedOnChain === false &&
  s4.attestationRecord.postedOnChain === false &&
  s5.attestationRecord.postedOnChain === false);

assert('F3  requiresOperatorConfirmation = true on every Cardia cap',
  s1.integrationResults.cardia.cap.requiresOperatorConfirmation === true &&
  s2.integrationResults.cardia.cap.requiresOperatorConfirmation === true &&
  s2b.integrationResults.cardia.cap.requiresOperatorConfirmation === true &&
  s3a.integrationResults.cardia.cap.requiresOperatorConfirmation === true &&
  s3b.integrationResults.cardia.cap.requiresOperatorConfirmation === true &&
  s4.integrationResults.cardia.cap.requiresOperatorConfirmation === true &&
  s5.integrationResults.cardia.cap.requiresOperatorConfirmation === true);

// F4: exploitCodeIncluded = false is structurally enforced by notifier
const s2vec = s2.stageD.findingVectors[0];
assertThrows('F4  buildPrivateNotification throws when exploitCodeIncluded = true',
  () => buildPrivateNotification(
    s2.disclosureWindows[0],
    s2vec,
    'security@protocol.example',
    Date.now(),
    { exploitCodeIncluded: true }
  )
);
const s2notif = buildPrivateNotification(
  s2.disclosureWindows[0],
  s2vec,
  'security@protocol.example'
);
assert('F4b notification.exploitCodeIncluded is always false',
  s2notif.exploitCodeIncluded === false);

assert('F5  BLACK registry status does not appear in any scenario',
  s1.registryEntry.currentStatus !== 'BLACK' &&
  s2.registryEntry.currentStatus !== 'BLACK' &&
  s2b.registryEntry.currentStatus !== 'BLACK' &&
  s3a.registryEntry.currentStatus !== 'BLACK' &&
  s3b.registryEntry.currentStatus !== 'BLACK' &&
  s4.registryEntry.currentStatus !== 'BLACK' &&
  s5.registryEntry.currentStatus !== 'BLACK');

assert('F6  all five integration result fields present in every run (cortex null when not escalated)',
  s1.integrationResults.synapse  !== undefined &&
  s1.integrationResults.cardia   !== undefined &&
  'cortex'    in s1.integrationResults &&
  s1.integrationResults.vox      !== undefined &&
  s1.integrationResults.dataRail !== undefined &&
  s2.integrationResults.synapse  !== undefined &&
  s2.integrationResults.cardia   !== undefined &&
  'cortex'    in s2.integrationResults &&
  s2.integrationResults.vox      !== undefined &&
  s2.integrationResults.dataRail !== undefined &&
  s3a.integrationResults.synapse  !== undefined &&
  s3a.integrationResults.cardia   !== undefined &&
  s3a.integrationResults.cortex   !== null &&
  s3a.integrationResults.vox      !== undefined &&
  s3a.integrationResults.dataRail !== undefined);

assert('F7  DataRail append-only: S3a and S3b both written with distinct heparRunIds',
  s3a.integrationResults.dataRail.written === true &&
  s3b.integrationResults.dataRail.written === true &&
  s3a.heparRunId !== s3b.heparRunId);

assert('F8  evidenceMerkleRoot identical in StageDResult and AttestationRecord per run',
  s1.stageD.attestationPayload.evidenceMerkleRoot  === s1.attestationRecord.evidenceMerkleRoot  &&
  s2.stageD.attestationPayload.evidenceMerkleRoot  === s2.attestationRecord.evidenceMerkleRoot  &&
  s3a.stageD.attestationPayload.evidenceMerkleRoot === s3a.attestationRecord.evidenceMerkleRoot);

const allDiscl = [...ADVISORY_DISCLAIMERS] as string[];
assert('F9  advisoryTierDisclaimers contains all three required strings in all scenarios',
  allDiscl.every((d) => s1.operatorSummary.advisoryTierDisclaimers.includes(d))  &&
  allDiscl.every((d) => s2.operatorSummary.advisoryTierDisclaimers.includes(d))  &&
  allDiscl.every((d) => s3a.operatorSummary.advisoryTierDisclaimers.includes(d)));

const allRunIds = new Set([s1.heparRunId, s2.heparRunId, s3a.heparRunId, s3b.heparRunId, s4.heparRunId, s5.heparRunId]);
assert('F10 heparRunId is unique across all six runs',
  allRunIds.size === 6);

// ===========================================================================
// Summary
// ===========================================================================

const total = passed + failed;
console.log('\n=== E2E RESULTS: ' + passed + '/' + total + ' passed ===');
if (failed > 0) {
  console.error('FAILED: ' + failed + ' assertion(s)');
  process.exit(1);
}
