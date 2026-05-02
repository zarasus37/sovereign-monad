// hepar/lib/agents/hepar-reentrancy.ts
// Hepar-Reentrancy agent: call-graph and state-mutation reentrancy vectors.
// Advisory tier -- execution layer is STUB.

import {
  AgentId, AgentFinding, AgentCampaignResult, AgentExecutor,
  FindingTemplate, SeededLCG, hashToNumber
} from '../stages/stageC-utils';

const AGENT_ID: AgentId = 'REENTRANCY';

const TEMPLATES: FindingTemplate[] = [
  {
    templateId: 'REENT-T01',
    description: 'Classic reentrancy: external call made before state update in withdraw()',
    exploitPreconditions: [
      'withdraw() sends ETH before zeroing balance',
      'Attacker contract implements receive() with re-entrant call'
    ],
    estLoss: 'up to 100% of contract ETH balance',
    baseSeverity: 9
  },
  {
    templateId: 'REENT-T02',
    description: 'Cross-function reentrancy: deposit() and withdraw() share mutable state',
    exploitPreconditions: [
      'balances mapping updated by deposit() is readable in withdraw() callback',
      'No reentrancy guard on deposit()'
    ],
    estLoss: 'up to 50% of protocol TVL',
    baseSeverity: 8
  },
  {
    templateId: 'REENT-T03',
    description: 'Read-only reentrancy exposes stale price to dependent protocol',
    exploitPreconditions: [
      'Protocol uses Curve/Balancer pool price during add_liquidity callback',
      'Downstream protocol reads pool price in same callback'
    ],
    estLoss: 'loss limited by dependent protocol TVL; typically 10-30%',
    baseSeverity: 6
  },
  {
    templateId: 'REENT-T04',
    description: 'ERC-777 tokensToSend hook triggers reentrancy before transfer accounting',
    exploitPreconditions: [
      'Protocol accepts ERC-777 tokens',
      'transferFrom called before internal balance update'
    ],
    estLoss: 'up to 100% of deposited ERC-777 token balance',
    baseSeverity: 8
  },
  {
    templateId: 'REENT-T05',
    description: 'ERC-721 safeTransfer hook re-enters mint before supply cap enforced',
    exploitPreconditions: [
      'onERC721Received callback triggered before totalSupply increment',
      'Attacker mints repeatedly within single transaction'
    ],
    estLoss: 'unlimited token mint; dilution of all holders',
    baseSeverity: 7
  }
];

export class HeparReentrancyAgent implements AgentExecutor {
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
        estLoss: { low: 0, high: 2_000_000 },
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
