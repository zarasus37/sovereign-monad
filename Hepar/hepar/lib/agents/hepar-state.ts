// hepar/lib/agents/hepar-state.ts
// Hepar-State agent: state machine violation vectors.
// Advisory tier -- execution layer is STUB.

import {
  AgentId, AgentFinding, AgentCampaignResult, AgentExecutor,
  FindingTemplate, SeededLCG, hashToNumber
} from '../stages/stageC-utils';

const AGENT_ID: AgentId = 'STATE';

const TEMPLATES: FindingTemplate[] = [
  {
    templateId: 'STATE-T01',
    description: 'Protocol enters PAUSED state while active loans remain; interest accrual halted',
    exploitPreconditions: [
      'pause() callable while loans are outstanding',
      'Interest accrual contract checks paused flag'
    ],
    estLoss: 'loss of accrued interest; frozen user funds',
    baseSeverity: 7
  },
  {
    templateId: 'STATE-T02',
    description: 'Unguarded state transition allows EMERGENCY_SHUTDOWN to be reversed by anyone',
    exploitPreconditions: [
      'shutdown() and resume() have identical access controls',
      'Resume callable in SHUTDOWN state without governance delay'
    ],
    estLoss: 'attacker can reopen protocol during known exploit window',
    baseSeverity: 7
  },
  {
    templateId: 'STATE-T03',
    description: 'Re-initialisation attack: initialize() callable again after upgrade sets owner to attacker',
    exploitPreconditions: [
      'Initializer modifier does not prevent second call after upgrade',
      'New implementation has initializer without version guard'
    ],
    estLoss: 'full ownership takeover; all protocol funds at risk',
    baseSeverity: 9
  },
  {
    templateId: 'STATE-T04',
    description: 'Permanent protocol brick via self-destruct of singleton library contract',
    exploitPreconditions: [
      'Library contract contains selfdestruct opcode',
      'Attacker can trigger selfdestruct via delegatecall'
    ],
    estLoss: 'permanent loss of all protocol functionality; user funds locked',
    baseSeverity: 8
  },
  {
    templateId: 'STATE-T05',
    description: 'Cross-contract state inconsistency: vault and strategy disagree on deposited amount',
    exploitPreconditions: [
      'Strategy reports balance independently from vault accounting',
      'Attacker can trigger harvest() between deposit and vault sync'
    ],
    estLoss: 'up to 20% of TVL due to accounting mismatch exploit',
    baseSeverity: 6
  }
];

export class HeparStateAgent implements AgentExecutor {
  readonly agentId: AgentId = AGENT_ID;

  run(agentSeed: string, forcedFindings?: AgentFinding[]): AgentCampaignResult {
    const rng = new SeededLCG(agentSeed);
    const findingCount = rng.nextInt(2, 4);
    const selected = rng.pickN(TEMPLATES, findingCount);
    const seedShort = String(hashToNumber(agentSeed)).slice(0, 8);

    const findings: AgentFinding[] = selected.map((t) => {
      const sev = Math.max(0, Math.min(9, t.baseSeverity + rng.nextInt(-1, 1)));
      return {
        vectorId: `${AGENT_ID}-${t.templateId}-${seedShort}`,
        agentId: AGENT_ID,
        severity: sev,
        description: t.description,
        exploitPreconditions: t.exploitPreconditions,
        estLoss: { low: 0, high: 1_500_000 },
        reproducibilitySeed: agentSeed,
        traceId: `${AGENT_ID}-trace-${seedShort}-${t.templateId}`,
        reproScore: 1.0
      };
    });

    const allFindings = forcedFindings !== undefined ? [...forcedFindings] : findings;

    return {
      agentId: AGENT_ID,
      seed: agentSeed,
      findings: allFindings,
      pathsExecuted: 40000 + rng.nextInt(0, 20000),
      uniqueBranchesHit: rng.nextInt(1000, 5000),
      coverageRatio: rng.nextFloat(0.3, 0.7),
      unknownRatio: rng.nextFloat(0.1, 0.4),
      executionStatus: 'STUB',
      completedAt: Date.now()
    };
  }
}
