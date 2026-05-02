// hepar/lib/agents/hepar-economic.ts
// Hepar-Economic agent: token economics and market attack vectors.
// Advisory tier -- execution layer is STUB.

import {
  AgentId, AgentFinding, AgentCampaignResult, AgentExecutor,
  FindingTemplate, SeededLCG, hashToNumber
} from '../stages/stageC-utils';

const AGENT_ID: AgentId = 'ECONOMIC';

const TEMPLATES: FindingTemplate[] = [
  {
    templateId: 'ECON-T01',
    description: 'Flashloan-funded drain: attacker borrows to manipulate collateral ratio then liquidates',
    exploitPreconditions: [
      'Protocol collateral ratio computed from spot DEX price',
      'Flashloan sufficient to move price by >20%',
      'Liquidation bonus exceeds flashloan fee'
    ],
    estLoss: 'up to 100% of under-collateralised positions',
    baseSeverity: 9
  },
  {
    templateId: 'ECON-T02',
    description: 'Oracle price manipulation via single-block TWAP window allows outsized borrow',
    exploitPreconditions: [
      'TWAP window is 1 block or less',
      'Attacker controls sufficient liquidity to move price'
    ],
    estLoss: 'up to 90% of borrowable reserves',
    baseSeverity: 9
  },
  {
    templateId: 'ECON-T03',
    description: 'Sandwich attack on large swap extracts MEV from retail users',
    exploitPreconditions: [
      'Pool has low slippage tolerance default',
      'Block builder cooperates with MEV searcher'
    ],
    estLoss: 'up to 3% of each large swap; cumulative over time',
    baseSeverity: 6
  },
  {
    templateId: 'ECON-T04',
    description: 'Sole-LP attack: only liquidity provider removes all LP then re-enters at will',
    exploitPreconditions: [
      'Pool has single dominant LP (>95% share)',
      'LP removal not time-locked'
    ],
    estLoss: 'up to 100% of user funds at LP discretion',
    baseSeverity: 8
  },
  {
    templateId: 'ECON-T05',
    description: 'Governance quorum manipulation via token borrowing flash-votes',
    exploitPreconditions: [
      'Governance snapshot taken at block of proposal creation',
      'Token lending market allows same-block borrow and vote'
    ],
    estLoss: 'full protocol control; all treasury funds at risk',
    baseSeverity: 8
  }
];

export class HeparEconomicAgent implements AgentExecutor {
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
        estLoss: { low: 0, high: 5_000_000 },
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
