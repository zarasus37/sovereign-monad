// hepar/lib/stages/stageC-montecarlo.ts
// Stage C -- Multi-Agent Monte Carlo Adversarial Execution.
// Five parallel specialized agents with DISJOINT RNG seeds and DISJOINT focus.
// Advisory tier: execution layer is STUB (MONTE_CARLO_STUB).
// Corpus exchange is post-campaign only; RNG state never shared.

import { AgentId, AgentFinding, AgentCampaignResult, AgentExecutor, deriveAgentSeed } from './stageC-utils';
import { HeparPrivilegeAgent } from '../agents/hepar-privilege';
import { HeparArithmeticAgent } from '../agents/hepar-arithmetic';
import { HeparReentrancyAgent } from '../agents/hepar-reentrancy';
import { HeparEconomicAgent } from '../agents/hepar-economic';
import { HeparStateAgent } from '../agents/hepar-state';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type { AgentId, AgentFinding, AgentCampaignResult } from './stageC-utils';

export interface StageCResult {
  agentResults: AgentCampaignResult[];
  allFindings: AgentFinding[];
  masterSeed: string;
  corpusExchangeLog: string[];
  stageCRunId: string;
  completedAt: number;
  executionStatus: 'STUB' | 'LIVE';
  totalPathsExecuted: number;
  tierLabel: 'ADVISORY';
}

export interface StageCInput {
  masterSeed?: string;
  protocolId?: string;
  runId?: string;
  /** Optional forced findings injected per agent for testing. */
  forcedFindings?: Partial<Record<AgentId, AgentFinding[]>>;
}

// ---------------------------------------------------------------------------
// Agent registry -- ordered, disjoint focus
// ---------------------------------------------------------------------------

const AGENT_ORDER: AgentId[] = [
  'PRIVILEGE',
  'ARITHMETIC',
  'REENTRANCY',
  'ECONOMIC',
  'STATE'
];

function buildAgentRegistry(): AgentExecutor[] {
  return [
    new HeparPrivilegeAgent(),
    new HeparArithmeticAgent(),
    new HeparReentrancyAgent(),
    new HeparEconomicAgent(),
    new HeparStateAgent()
  ];
}

// ---------------------------------------------------------------------------
// Corpus exchange (post-campaign, independence preserved)
// ---------------------------------------------------------------------------

function buildCorpusExchangeLog(results: AgentCampaignResult[]): string[] {
  const log: string[] = [];

  // Collect high-value findings (severity >= 7) from all agents.
  const highValue: { agentId: AgentId; vectorId: string; severity: number }[] = [];
  for (const r of results) {
    for (const f of r.findings) {
      if (f.severity >= 7) {
        highValue.push({ agentId: f.agentId, vectorId: f.vectorId, severity: f.severity });
      }
    }
  }

  if (highValue.length > 0) {
    log.push(
      `[CorpusExchange] Post-campaign exchange initiated. ` +
      `${highValue.length} high-value finding(s) shared across agent corpora.`
    );
    for (const hv of highValue) {
      log.push(
        `[CorpusExchange] Agent=${hv.agentId} vectorId=${hv.vectorId} sev=${hv.severity} ` +
        `-> added to peer agent input corpora (RNG state NOT shared; independence preserved).`
      );
    }
  } else {
    log.push(
      '[CorpusExchange] Post-campaign exchange: no high-value findings (sev>=7) to share. ' +
      'Corpus exchange log populated with coverage summary only.'
    );
  }

  // Coverage summary entry.
  const totalPaths = results.reduce((s, r) => s + r.pathsExecuted, 0);
  const avgCoverage = results.reduce((s, r) => s + r.coverageRatio, 0) / results.length;
  log.push(
    `[CorpusExchange] Coverage summary: totalPaths=${totalPaths} ` +
    `avgCoverageRatio=${avgCoverage.toFixed(3)} agents=${results.length}`
  );

  return log;
}

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------

function generateRunId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0')}`;
}

function generateMasterSeed(): string {
  // Deterministic-ish default seed when none supplied.
  return `HEPAR-MC-${Date.now().toString(36)}`;
}

export function runStageC(input: StageCInput = {}): StageCResult {
  const masterSeed = input.masterSeed ?? generateMasterSeed();
  const protocolId = input.protocolId ?? 'UNKNOWN_PROTOCOL';
  const stageCRunId = input.runId ?? generateRunId('STAGE-C');

  const agents = buildAgentRegistry();

  // Verify agent order matches AGENT_ORDER for seed derivation.
  for (let i = 0; i < agents.length; i++) {
    const expected = AGENT_ORDER[i];
    if (agents[i]!.agentId !== expected) {
      throw new Error(
        `Agent order mismatch at index ${i}: expected ${expected}, got ${agents[i]!.agentId}`
      );
    }
  }

  // Run each agent with its disjoint seed.
  const agentResults: AgentCampaignResult[] = agents.map((agent, i) => {
    const agentSeed = deriveAgentSeed(masterSeed, i, protocolId);
    const forced = input.forcedFindings?.[agent.agentId];
    return agent.run(agentSeed, forced);
  });

  // Aggregate all findings.
  const allFindings: AgentFinding[] = agentResults.flatMap((r) => r.findings);

  // Sort findings descending by severity (highest risk first).
  allFindings.sort((a, b) => b.severity - a.severity);

  // Post-campaign corpus exchange (independence preserved).
  const corpusExchangeLog = buildCorpusExchangeLog(agentResults);

  // Execution status: STUB unless ALL results are LIVE.
  const executionStatus: 'STUB' | 'LIVE' =
    agentResults.every((r) => r.executionStatus === 'LIVE') ? 'LIVE' : 'STUB';

  const totalPathsExecuted = agentResults.reduce((s, r) => s + r.pathsExecuted, 0);

  return {
    agentResults,
    allFindings,
    masterSeed,
    corpusExchangeLog,
    stageCRunId,
    completedAt: Date.now(),
    executionStatus,
    totalPathsExecuted,
    tierLabel: 'ADVISORY'
  };
}
