// hepar-core/agents/HeparReentrancyAgent.ts
// Detects reentrancy vulnerabilities and callback-based attack vectors

import type { AgentCampaignResult, AgentFinding } from '../stages/stageC-utils';
import { SeededLCG } from '../stages/stageC-utils';

export class HeparReentrancyAgent {
  readonly agentId = 'REENTRANCY' as const;

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
    this.pathsExecuted = this.rng.nextInt(15, 60);
    this.uniqueBranches = new Set([
      'classic_reentrancy_transfer',
      'delegatecall_callback',
      'receive_hook_exploit',
      'erc721_callback_attack',
    ]);

    return {
      agentId: this.agentId,
      seed: this.seed,
      findings: this.findings,
      pathsExecuted: this.pathsExecuted,
      uniqueBranchesHit: this.uniqueBranches.size,
      coverageRatio: 0.68,
      unknownRatio: 0.12,
      executionStatus: 'STUB',
      completedAt: Date.now() - startTime,
    };
  }

  private generateSyntheticFindings(): AgentFinding[] {
    const findings: AgentFinding[] = [];
    const templates = [
      {
        description: 'Classic reentrancy via external call before state update',
        severity: 0.95,
        estLoss: { low: 100000, high: 5000000 },
      },
      {
        description: 'Delegatecall callback vulnerability in token transfer',
        severity: 0.89,
        estLoss: { low: 50000, high: 1000000 },
      },
      {
        description: 'ERC-721 onERC721Received callback reentrancy',
        severity: 0.76,
        estLoss: { low: 10000, high: 100000 },
      },
    ];

    for (let i = 0; i < this.rng.nextInt(0, 3); i++) {
      const t = templates[i % templates.length]!;
      findings.push({
        vectorId: `reen_${this.rng.next().toString(16)}`,
        agentId: this.agentId,
        severity: t.severity,
        description: t.description,
        exploitPreconditions: ['External call to untrusted contract', 'State not updated before call'],
        estLoss: t.estLoss,
        reproducibilitySeed: this.seed,
        traceId: `trace_reen_${i}`,
        reproScore: 0.75 + this.rng.nextFloat(0, 0.2),
      });
    }

    return findings;
  }
}
