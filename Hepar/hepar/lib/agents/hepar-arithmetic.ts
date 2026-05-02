// hepar/lib/agents/hepar-arithmetic.ts
// Hepar-Arithmetic agent: mathematical boundary violation vectors.
// Advisory tier -- execution layer is STUB.

import {
  AgentId, AgentFinding, AgentCampaignResult, AgentExecutor,
  FindingTemplate, SeededLCG, hashToNumber
} from '../stages/stageC-utils';

const AGENT_ID: AgentId = 'ARITHMETIC';

const TEMPLATES: FindingTemplate[] = [
  {
    templateId: 'ARITH-T01',
    description: 'uint256 overflow in unchecked accumulation of fee-on-transfer tokens',
    exploitPreconditions: [
      'Protocol accepts fee-on-transfer ERC-20',
      'Balance accounting uses unchecked addition over many deposits'
    ],
    estLoss: 'up to 100% of accumulated fees',
    baseSeverity: 8
  },
  {
    templateId: 'ARITH-T02',
    description: 'Division-by-zero in share price calculation when totalSupply is drained',
    exploitPreconditions: [
      'totalSupply can reach 0 via redemption',
      'No zero-supply guard before price division'
    ],
    estLoss: 'protocol brick; denial of service',
    baseSeverity: 7
  },
  {
    templateId: 'ARITH-T03',
    description: 'Precision loss in fixed-point interest accrual leads to silent underpayment',
    exploitPreconditions: [
      'Interest computed in integer arithmetic without scaling',
      'Attacker makes many small borrows to accumulate rounding error'
    ],
    estLoss: 'up to 5% of protocol interest over time',
    baseSeverity: 5
  },
  {
    templateId: 'ARITH-T04',
    description: 'Flashloan inflates reserve before arithmetic check allows outsized withdrawal',
    exploitPreconditions: [
      'Reserve ratio checked after flashloan callback',
      'Protocol uses spot balance instead of pre-flash snapshot'
    ],
    estLoss: 'up to 80% of protocol reserves',
    baseSeverity: 8
  },
  {
    templateId: 'ARITH-T05',
    description: 'Rounding exploit in partial-fill order book favours attacker per iteration',
    exploitPreconditions: [
      'Partial fills rounded down in attacker favour',
      'Attacker can loop fill in single transaction'
    ],
    estLoss: 'up to 2% of order book depth per attack',
    baseSeverity: 6
  }
];

export class HeparArithmeticAgent implements AgentExecutor {
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
        estLoss: { low: 0, high: 500_000 },
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
