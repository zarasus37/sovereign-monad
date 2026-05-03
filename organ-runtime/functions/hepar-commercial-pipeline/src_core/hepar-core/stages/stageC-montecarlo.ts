// hepar-core/stages/stageC-montecarlo.ts
// Stage C: Monte Carlo Path Execution and Agent Coordination
// Simulates execution paths, invokes agents in parallel, aggregates results

import type {
  AgentId,
  AgentFinding,
  AgentCampaignResult,
  AgentExecutor,
} from './stageC-utils';
import {
  deriveAgentSeed,
  SeededLCG,
} from './stageC-utils';

export interface StageCConfig {
  pathsPerAgent: number;
  agentsToRun: AgentId[];
  masterSeed: string;
  timeoutMs: number;
  allowStubMode: boolean;
}

export interface ExecutionTrace {
  executionId: string;
  traceHash: string;
  contractAddress: string;
  initiatorAddress: string;
  callSequence: string[];
  stateReads: Record<string, string>;
  stateWrites: Record<string, string>;
  gasUsed: number;
  valueFlow: bigint;
  reentrancyPath?: string[];
  arithmeticOps?: Array<{ op: string; a: string; b: string; result: string }>;
}

export interface StageCResult {
  stageId: 'C';
  statusCode: number;
  campaignResults: Map<AgentId, AgentCampaignResult>;
  aggregateFindings: AgentFinding[];
  totalPaths: number;
  totalFindings: number;
  executionTime: number;
  executedAt: number;
}

export class StageC {
  constructor(
    readonly config: StageCConfig,
    readonly agents: Map<AgentId, AgentExecutor>,
  ) {}

  async execute(protocolId: string, addressesToProbe: string[]): Promise<StageCResult> {
    const startTime = performance.now();
    const campaignResults = new Map<AgentId, AgentCampaignResult>();
    const allFindings: AgentFinding[] = [];
    let totalPaths = 0;

    try {
      // Run each agent in series (or parallel with Promise.all for real concurrency)
      for (const agentId of this.config.agentsToRun) {
        const executor = this.agents.get(agentId);
        if (!executor) {
          console.warn(`[StageC] Agent ${agentId} not registered.`);
          continue;
        }

        const agentSeed = deriveAgentSeed(this.config.masterSeed, Array.from(this.config.agentsToRun).indexOf(agentId), protocolId);
        const result = executor.run(agentSeed);

        campaignResults.set(agentId, result);
        allFindings.push(...result.findings);
        totalPaths += result.pathsExecuted;
      }

      return {
        stageId: 'C',
        statusCode: 200,
        campaignResults,
        aggregateFindings: this.deduplicateFindings(allFindings),
        totalPaths,
        totalFindings: allFindings.length,
        executionTime: performance.now() - startTime,
        executedAt: Date.now(),
      };
    } catch (err) {
      console.error('[StageC] Error during execution:', err);
      return {
        stageId: 'C',
        statusCode: 500,
        campaignResults,
        aggregateFindings: [],
        totalPaths,
        totalFindings: 0,
        executionTime: performance.now() - startTime,
        executedAt: Date.now(),
      };
    }
  }

  private deduplicateFindings(findings: AgentFinding[]): AgentFinding[] {
    const seen = new Set<string>();
    const dedup: AgentFinding[] = [];
    for (const f of findings) {
      const sig = `${f.vectorId}:${f.agentId}:${f.description}`;
      if (!seen.has(sig)) {
        seen.add(sig);
        dedup.push(f);
      }
    }
    return dedup;
  }

  /**
   * Example: Generate synthetic execution traces for testing/STUB mode
   */
  static generateSyntheticTraces(config: StageCConfig, protocolId: string): ExecutionTrace[] {
    const rng = new SeededLCG(config.masterSeed);
    const traces: ExecutionTrace[] = [];

    for (let i = 0; i < Math.min(config.pathsPerAgent, 5); i++) {
      const callSeq = ['delegatecall', 'call', 'staticcall', 'callcode'];
      traces.push({
        executionId: `trace-${i}`,
        traceHash: `0x${rng.next().toString(16).padStart(64, '0')}`,
        contractAddress: `0x${rng.next().toString(16).padStart(40, '0')}`,
        initiatorAddress: `0x${rng.next().toString(16).padStart(40, '0')}`,
        callSequence: rng.pickN(callSeq, rng.nextInt(1, 3)),
        stateReads: { key0: `0x${rng.next().toString(16)}`, key1: `0x${rng.next().toString(16)}` },
        stateWrites: { key0: `0x${rng.next().toString(16)}` },
        gasUsed: rng.nextInt(21000, 5000000),
        valueFlow: BigInt(rng.nextInt(0, 1000000000)),
      });
    }

    return traces;
  }
}
