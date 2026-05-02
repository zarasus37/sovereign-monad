// hepar/lib/agents/hepar-privilege.ts
// Hepar-Privilege agent: permission-based attack vectors.
// Advisory tier -- execution layer is STUB.

import {
  AgentId, AgentFinding, AgentCampaignResult, AgentExecutor,
  FindingTemplate, SeededLCG, hashToNumber
} from '../stages/stageC-utils';

const AGENT_ID: AgentId = 'PRIVILEGE';

const TEMPLATES: FindingTemplate[] = [
  {
    templateId: 'PRIV-T01',
    description: 'Unprivileged caller reaches onlyOwner function via delegatecall chain',
    exploitPreconditions: [
      'Target proxy uses delegatecall to implementation',
      'Implementation does not re-check msg.sender after delegation',
      'Attacker controls an intermediary contract'
    ],
    estLoss: 'up to 100% of protocol reserves',
    baseSeverity: 9
  },
  {
    templateId: 'PRIV-T02',
    description: 'Role escalation via misconfigured AccessControl grant path',
    exploitPreconditions: [
      'ROLE_ADMIN is grantable by DEFAULT_ADMIN',
      'DEFAULT_ADMIN transferred to attacker-controlled address'
    ],
    estLoss: 'up to 100% of protocol reserves',
    baseSeverity: 8
  },
  {
    templateId: 'PRIV-T03',
    description: 'Storage collision between proxy and implementation overwrites owner slot',
    exploitPreconditions: [
      'Proxy uses non-EIP-1967 storage layout',
      'Implementation declares state at slot 0'
    ],
    estLoss: 'full protocol ownership takeover',
    baseSeverity: 9
  },
  {
    templateId: 'PRIV-T04',
    description: 'Pause bypass via paused-state check missing in internal call path',
    exploitPreconditions: [
      'whenNotPaused modifier absent on internal helper',
      'External function routes through unguarded internal path'
    ],
    estLoss: 'operations during emergency pause; up to 30% of TVL',
    baseSeverity: 6
  },
  {
    templateId: 'PRIV-T05',
    description: 'ERC-20 approve griefing allows front-run of allowance change',
    exploitPreconditions: [
      'Token does not implement increaseAllowance/decreaseAllowance',
      'Approval from large holder is observed in mempool'
    ],
    estLoss: 'double-spend of approved allowance; bounded by holder balance',
    baseSeverity: 5
  }
];

export class HeparPrivilegeAgent implements AgentExecutor {
  readonly agentId: AgentId = AGENT_ID;

  run(agentSeed: string, forcedFindings?: AgentFinding[]): AgentCampaignResult {
    const rng = new SeededLCG(agentSeed);
    const findingCount = rng.nextInt(2, 4);
    const selected = rng.pickN(TEMPLATES, findingCount);
    const seedShort = String(hashToNumber(agentSeed)).slice(0, 8);

    const findings: AgentFinding[] = selected.map((t) => {
      // Severity: baseSeverity +/- 1, capped at 9 (never 10 in stub output).
      const sev = Math.max(0, Math.min(9, t.baseSeverity + rng.nextInt(-1, 1)));
      const finding: AgentFinding = {
        vectorId: `${AGENT_ID}-${t.templateId}-${seedShort}`,
        agentId: AGENT_ID,
        severity: sev,
        description: t.description,
        exploitPreconditions: t.exploitPreconditions,
        estLoss: { low: 0, high: 1_000_000 },
        reproducibilitySeed: agentSeed,
        traceId: `${AGENT_ID}-trace-${seedShort}-${t.templateId}`,
        reproScore: 1.0,
      };
      // CAL-006 pre-condition 1: PRIV-T03 (proxy storage-collision / implementation
      // slot overwrite) requires live bytecode confirmation that the target proxy
      // uses a non-EIP-1967 storage layout before this finding can be treated as
      // protocol-specific evidence. Stub template alone is insufficient.
      if (t.templateId === 'PRIV-T03') {
        finding.requiresLiveBytecodeConfirmation = true;
      }
      return finding;
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
