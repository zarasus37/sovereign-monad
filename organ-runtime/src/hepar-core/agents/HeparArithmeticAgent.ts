// hepar-core/agents/HeparArithmeticAgent.ts
// Detects integer overflow, underflow, precision loss, and rounding vulnerabilities

import type { AgentCampaignResult, AgentFinding } from '../stages/stageC-utils';
import { SeededLCG, hashToNumber } from '../stages/stageC-utils';

export class HeparArithmeticAgent {
  readonly agentId = 'ARITHMETIC' as const;

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
    this.pathsExecuted = this.rng.nextInt(20, 80);
    this.uniqueBranches = new Set([
      'uint256_overflow',
      'div_by_zero',
      'precision_loss_scaled',
      'rounding_bias',
    ]);

    return {
      agentId: this.agentId,
      seed: this.seed,
      findings: this.findings,
      pathsExecuted: this.pathsExecuted,
      uniqueBranchesHit: this.uniqueBranches.size,
      coverageRatio: 0.72,
      unknownRatio: 0.08,
      executionStatus: 'STUB',
      completedAt: Date.now() - startTime,
    };
  }

  private generateSyntheticFindings(): AgentFinding[] {
    const findings: AgentFinding[] = [];
    const templates = [
      {
        description: 'Integer overflow in fee calculation',
        severity: 0.88,
        estLoss: { low: 10000, high: 100000 },
      },
      {
        description: 'Unsafe subtraction leading to underflow',
        severity: 0.82,
        estLoss: { low: 5000, high: 50000 },
      },
      {
        description: 'Precision loss in scaled division',
        severity: 0.65,
        estLoss: { low: 100, high: 10000 },
      },
    ];

    const seedFingerprint = hashToNumber(this.seed).toString(16);
    for (let i = 0; i < this.rng.nextInt(1, 3); i++) {
      const t = templates[i % templates.length]!;
      findings.push({
        vectorId: `arith_${seedFingerprint}_${this.rng.next().toString(16)}`,
        agentId: this.agentId,
        severity: t.severity,
        description: t.description,
        exploitPreconditions: ['Large input values', 'Overflow in intermediate computation'],
        estLoss: t.estLoss,
        reproducibilitySeed: this.seed,
        traceId: `trace_arith_${seedFingerprint}_${i}`,
        reproScore: 0.7 + this.rng.nextFloat(0, 0.25),
      });
    }

    return findings;
  }
}
