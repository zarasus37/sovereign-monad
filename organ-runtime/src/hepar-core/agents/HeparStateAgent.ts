// hepar-core/agents/HeparStateAgent.ts
// Detects state consistency violations, invariant breaks, and logical fallacies

import type { AgentCampaignResult, AgentFinding } from '../stages/stageC-utils';
import { SeededLCG, hashToNumber } from '../stages/stageC-utils';

export class HeparStateAgent {
  readonly agentId = 'STATE' as const;

  private findings: AgentFinding[] = [];
  private pathsExecuted = 0;
  private uniqueBranches = new Set<string>();
  private rng: SeededLCG;

  constructor(private seed: string) {
    this.rng = new SeededLCG(seed);
  }

  run(): AgentCampaignResult {
    const startTime = Date.now();

    this.findings = this.generateSyntheticFindings();
    this.pathsExecuted = this.rng.nextInt(30, 70);
    this.uniqueBranches = new Set([
      'balance_invariant_violated',
      'token_locked_forever',
      'accounting_mismatch',
      'state_desync_with_ledger',
    ]);

    return {
      agentId: this.agentId,
      seed: this.seed,
      findings: this.findings,
      pathsExecuted: this.pathsExecuted,
      uniqueBranchesHit: this.uniqueBranches.size,
      coverageRatio: 0.62,
      unknownRatio: 0.14,
      executionStatus: 'STUB',
      completedAt: Date.now() - startTime,
    };
  }

  private generateSyntheticFindings(): AgentFinding[] {
    const findings: AgentFinding[] = [];
    const templates = [
      {
        description: 'Total supply invariant can be violated',
        severity: 0.87,
        estLoss: { low: 50000, high: 1000000 },
      },
      {
        description: 'Locked tokens permanently unretrievable',
        severity: 0.93,
        estLoss: { low: 100000, high: 10000000 },
      },
      {
        description: 'Balance mapping desynchronized from ledger',
        severity: 0.74,
        estLoss: { low: 1000, high: 100000 },
      },
    ];

    const seedFingerprint = hashToNumber(this.seed).toString(16);
    for (let i = 0; i < this.rng.nextInt(1, 3); i++) {
      const t = templates[i % templates.length]!;
      findings.push({
        vectorId: `state_${seedFingerprint}_${this.rng.next().toString(16)}`,
        agentId: this.agentId,
        severity: t.severity,
        description: t.description,
        exploitPreconditions: ['Execution of specific transaction sequence', 'State mutation ordering'],
        estLoss: t.estLoss,
        reproducibilitySeed: this.seed,
        traceId: `trace_state_${seedFingerprint}_${i}`,
        reproScore: 0.65 + this.rng.nextFloat(0, 0.25),
      });
    }

    return findings;
  }
}
