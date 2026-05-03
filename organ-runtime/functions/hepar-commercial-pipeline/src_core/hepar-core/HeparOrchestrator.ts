// hepar-core/HeparOrchestrator.ts
// Main entry point: coordinates Stages A–D with full pipeline execution

import { StageA, type StageAResult, type StageAConfig } from './stages/stageA-static';
import { StageB, type StageBResult, type StageBConfig } from './stages/stageB-symbolic';
import { StageC, type StageCResult, type StageCConfig } from './stages/stageC-montecarlo';
import { StageD, type StageDResult, type StageDConfig } from './stages/stageD-consensus';
import { createAgentRegistry } from './agents/index';

export interface HeparOrchestratorConfig {
  stageA: StageAConfig;
  stageB: StageBConfig;
  stageC: StageCConfig;
  stageD: StageDConfig;
}

export interface HeparPipelineResult {
  stageA: StageAResult | null;
  stageB: StageBResult | null;
  stageC: StageCResult | null;
  stageD: StageDResult | null;
  totalTime: number;
  pipelineStatus: 'SUCCESS' | 'PARTIAL' | 'FAILURE';
}

export class HeparOrchestrator {
  private stageA: StageA;
  private stageB: StageB;
  private stageC: StageC;
  private stageD: StageD;

  constructor(config: HeparOrchestratorConfig) {
    this.stageA = new StageA(config.stageA);
    this.stageB = new StageB(config.stageB);

    // Create agent registry and initialize Stage C
    const agents = createAgentRegistry(config.stageC.masterSeed, 'STUB');
    this.stageC = new StageC(config.stageC, agents);

    this.stageD = new StageD(config.stageD);
  }

  /**
   * Execute full Hepar pipeline: A → B → C → D
   */
  async executeFullPipeline(protocolId: string, addressesToProbe: string[]): Promise<HeparPipelineResult> {
    const startTime = performance.now();
    let stageAResult: StageAResult | null = null;
    let stageBResult: StageBResult | null = null;
    let stageCResult: StageCResult | null = null;
    let stageDResult: StageDResult | null = null;

    try {
      // Stage A: Static forensics
      console.log('[HeparOrchestrator] Starting Stage A (Static Forensics)...');
      stageAResult = await this.stageA.analyze(protocolId, addressesToProbe);
      console.log(`[HeparOrchestrator] Stage A completed with ${stageAResult.findings.length} findings.`);

      // Stage B: Symbolic proving
      console.log('[HeparOrchestrator] Starting Stage B (Symbolic Proving)...');
      stageBResult = await this.stageB.prove(protocolId, stageAResult.findings.map(f => f.vectorId));
      console.log(`[HeparOrchestrator] Stage B completed with ${stageBResult.invariantViolations.length} violations.`);

      // Stage C: Monte Carlo execution
      console.log('[HeparOrchestrator] Starting Stage C (Monte Carlo Execution)...');
      stageCResult = await this.stageC.execute(protocolId, addressesToProbe);
      console.log(`[HeparOrchestrator] Stage C completed with ${stageCResult.totalFindings} findings across ${stageCResult.totalPaths} paths.`);

      // Stage D: Consensus fusion
      console.log('[HeparOrchestrator] Starting Stage D (Consensus Fusion)...');
      stageDResult = this.stageD.fuse(stageBResult, stageCResult, protocolId);
      console.log(`[HeparOrchestrator] Stage D completed with decision: ${stageDResult.decision}`);

      return {
        stageA: stageAResult,
        stageB: stageBResult,
        stageC: stageCResult,
        stageD: stageDResult,
        totalTime: performance.now() - startTime,
        pipelineStatus: 'SUCCESS',
      };
    } catch (err) {
      console.error('[HeparOrchestrator] Pipeline error:', err);
      return {
        stageA: stageAResult,
        stageB: stageBResult,
        stageC: stageCResult,
        stageD: stageDResult,
        totalTime: performance.now() - startTime,
        pipelineStatus: stageAResult ? 'PARTIAL' : 'FAILURE',
      };
    }
  }

  /**
   * Execute up to a specific stage
   */
  async executeUpToStage(
    stage: 'A' | 'B' | 'C' | 'D',
    protocolId: string,
    addressesToProbe: string[],
  ): Promise<HeparPipelineResult> {
    const startTime = performance.now();
    let stageAResult: StageAResult | null = null;
    let stageBResult: StageBResult | null = null;
    let stageCResult: StageCResult | null = null;
    let stageDResult: StageDResult | null = null;

    try {
      if (stage === 'A' || stage === 'B' || stage === 'C' || stage === 'D') {
        console.log(`[HeparOrchestrator] Executing up to Stage ${stage}...`);
        stageAResult = await this.stageA.analyze(protocolId, addressesToProbe);

        if (stage === 'B' || stage === 'C' || stage === 'D') {
          stageBResult = await this.stageB.prove(protocolId, stageAResult.findings.map(f => f.vectorId));

          if (stage === 'C' || stage === 'D') {
            stageCResult = await this.stageC.execute(protocolId, addressesToProbe);

            if (stage === 'D') {
              stageDResult = this.stageD.fuse(stageBResult, stageCResult, protocolId);
            }
          }
        }
      }

      return {
        stageA: stageAResult,
        stageB: stageBResult,
        stageC: stageCResult,
        stageD: stageDResult,
        totalTime: performance.now() - startTime,
        pipelineStatus: 'SUCCESS',
      };
    } catch (err) {
      console.error(`[HeparOrchestrator] Error executing up to Stage ${stage}:`, err);
      return {
        stageA: stageAResult,
        stageB: stageBResult,
        stageC: stageCResult,
        stageD: stageDResult,
        totalTime: performance.now() - startTime,
        pipelineStatus: stageAResult ? 'PARTIAL' : 'FAILURE',
      };
    }
  }
}

/**
 * Factory: Create a pre-configured HeparOrchestrator with sensible defaults
 */
export function createDefaultHeparOrchestrator(): HeparOrchestrator {
  return new HeparOrchestrator({
    stageA: {
      bytecodeThreshold: 500,
      patternMatchingDepth: 3,
    },
    stageB: {
      timeoutPerInvariant: 5000,
      allowStubMode: true,
    },
    stageC: {
      pathsPerAgent: 50,
      agentsToRun: ['PRIVILEGE', 'ARITHMETIC', 'REENTRANCY', 'ECONOMIC', 'STATE'],
      masterSeed: `hepar_main_${Date.now()}`,
      timeoutMs: 30000,
      allowStubMode: true,
    },
    stageD: {
      consensusThreshold: 0.5,
      severityWeights: { BLOCK: 2.0, WARN: 1.0, ALLOW: 0.5 },
      allowPartialConsensus: true,
    },
  });
}
