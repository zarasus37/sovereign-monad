// hepar-core/stages/stageD-consensus.ts
// Stage D: Consensus Fusion and Decision Integration
// Merges SymbolicResult from Stage B and AgentFindings from Stage C into attestations

import type { SymbolicResult, ActionBand, FindingVector, AttestationPayload } from '../types/hepar.types';
import type { StageCResult } from './stageC-montecarlo';
import type { StageBResult } from './stageB-symbolic';

export interface StageDConfig {
  consensusThreshold: number;
  severityWeights: Record<string, number>;
  allowPartialConsensus: boolean;
}

export interface DecisionVote {
  voterId: string;
  decision: 'BLOCK' | 'ALLOW' | 'WARN' | 'INVESTIGATE';
  confidence: number;
  reasoning: string;
}

export interface StageDResult {
  stageId: 'D';
  statusCode: number;
  decision: 'BLOCK' | 'ALLOW' | 'WARN' | 'INVESTIGATE';
  confidence: number;
  attestation: AttestationPayload;
  votes: DecisionVote[];
  aggregatedBand: ActionBand;
  fusionTime: number;
  executedAt: number;
}

export class StageD {
  constructor(readonly config: StageDConfig) {}

  /**
   * Fuse Stage B symbolic results and Stage C agent findings into a final decision.
   */
  fuse(
    stageBResult: StageBResult | null,
    stageCResult: StageCResult | null,
    protocolId: string,
  ): StageDResult {
    const startTime = performance.now();
    const votes: DecisionVote[] = [];
    const findings: FindingVector[] = [];

    // Stage B contributes symbolic invariant violations
    if (stageBResult && stageBResult.statusCode === 200) {
      for (const inv of stageBResult.invariantViolations) {
        findings.push({
          vectorId: inv.invariantId,
          vectorType: 'SYMBOLIC_INVARIANT',
          severity: inv.severity,
          description: inv.description,
          confidence: inv.confidence,
        });

        // Vote from Stage B
        votes.push({
          voterId: 'STAGE_B_SYMBOLIC',
          decision: inv.severity >= 0.8 ? 'BLOCK' : inv.severity >= 0.5 ? 'WARN' : 'ALLOW',
          confidence: inv.confidence,
          reasoning: `Symbolic engine: ${inv.description}`,
        });
      }
    }

    // Stage C contributes agent findings
    if (stageCResult && stageCResult.statusCode === 200) {
      for (const agentResult of stageCResult.campaignResults.values()) {
        for (const finding of agentResult.findings) {
          findings.push({
            vectorId: finding.vectorId,
            vectorType: 'AGENT_FINDING',
            severity: finding.severity,
            description: finding.description,
            confidence: finding.reproScore,
          });

          // Vote from agent
          votes.push({
            voterId: `AGENT_${agentResult.agentId}`,
            decision: finding.severity >= 0.8 ? 'BLOCK' : finding.severity >= 0.5 ? 'WARN' : 'ALLOW',
            confidence: finding.reproScore,
            reasoning: `${agentResult.agentId} agent: ${finding.description}`,
          });
        }
      }
    }

    // Consensus: aggregate votes
    const decision = this.aggregateVotes(votes);
    const confidence = this.computeConfidence(votes);
    const band = this.mapDecisionToBand(decision, confidence);

    const attestation: AttestationPayload = {
      protocolId,
      decision,
      confidence,
      findings,
      attestationTime: Date.now(),
      stageDConfig: JSON.stringify(this.config),
    };

    return {
      stageId: 'D',
      statusCode: 200,
      decision,
      confidence,
      attestation,
      votes,
      aggregatedBand: band,
      fusionTime: performance.now() - startTime,
      executedAt: Date.now(),
    };
  }

  private aggregateVotes(votes: DecisionVote[]): 'BLOCK' | 'ALLOW' | 'WARN' | 'INVESTIGATE' {
    if (votes.length === 0) return 'ALLOW';

    const tally: Record<string, number> = { BLOCK: 0, WARN: 0, ALLOW: 0, INVESTIGATE: 0 };
    for (const vote of votes) {
      tally[vote.decision] += vote.confidence;
    }

    const total = votes.reduce((sum, v) => sum + v.confidence, 0);
    const thresholdVotes = total * this.config.consensusThreshold;

    if (tally.BLOCK >= thresholdVotes) return 'BLOCK';
    if (tally.WARN >= thresholdVotes) return 'WARN';
    if (tally.INVESTIGATE > 0 && tally.INVESTIGATE >= thresholdVotes) return 'INVESTIGATE';
    return 'ALLOW';
  }

  private computeConfidence(votes: DecisionVote[]): number {
    if (votes.length === 0) return 0;
    return votes.reduce((sum, v) => sum + v.confidence, 0) / votes.length;
  }

  private mapDecisionToBand(decision: string, confidence: number): ActionBand {
    const baseScore = decision === 'BLOCK' ? 1.0 : decision === 'WARN' ? 0.6 : decision === 'INVESTIGATE' ? 0.4 : 0.1;
    return {
      band: decision,
      score: baseScore * confidence,
      confidence,
      escalationPath: decision === 'BLOCK' ? ['ALERT_OPS', 'CANCEL_TXN', 'NOTIFY_ECOSYSTEM'] : [],
    };
  }
}
