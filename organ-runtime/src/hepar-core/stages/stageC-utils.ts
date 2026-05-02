// hepar-core/stages/stageC-utils.ts
// Shared utilities and types for Stage C Monte Carlo.
// NO imports from stageC-montecarlo or any agent file -- avoids circular deps.

export type AgentId = 'PRIVILEGE' | 'ARITHMETIC' | 'REENTRANCY' | 'ECONOMIC' | 'STATE';

export interface FindingTemplate {
  templateId: string;
  description: string;
  exploitPreconditions: string[];
  estLoss: string;
  baseSeverity: number;
}

export interface AgentFinding {
  vectorId: string;
  agentId: AgentId;
  severity: number;
  description: string;
  exploitPreconditions: string[];
  estLoss: { low: number; high: number };
  reproducibilitySeed: string;
  traceId: string;
  reproScore: number;
}

export interface AgentCampaignResult {
  agentId: AgentId;
  seed: string;
  findings: AgentFinding[];
  pathsExecuted: number;
  uniqueBranchesHit: number;
  coverageRatio: number;
  unknownRatio: number;
  executionStatus: 'STUB' | 'LIVE';
  completedAt: number;
}

export interface AgentExecutor {
  readonly agentId: AgentId;
  run(agentSeed: string, forcedFindings?: AgentFinding[]): AgentCampaignResult;
}

export function hashToNumber(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  }
  return h >>> 0;
}

export function deriveAgentSeed(masterSeed: string, agentIndex: number, protocolId: string): string {
  return `${masterSeed}:agent${agentIndex}:${protocolId}`;
}

export class SeededLCG {
  private state: number;

  constructor(seedStr: string) {
    this.state = hashToNumber(seedStr);
  }

  next(): number {
    const a = 1664525;
    const c = 1013904223;
    const lo = (this.state & 0xffff) * a;
    const hi = ((this.state >>> 16) * a) & 0xffff;
    this.state = ((lo + (hi << 16)) + c) >>> 0;
    return this.state;
  }

  nextInt(min: number, max: number): number {
    const range = max - min + 1;
    return min + (this.next() % range);
  }

  nextFloat(min: number, max: number): number {
    const t = this.next() / 0x100000000;
    return min + t * (max - min);
  }

  pickN<T>(arr: T[], n: number): T[] {
    const copy = arr.slice();
    const len = copy.length;
    const safeN = Math.min(n, len);
    for (let i = len - 1; i > 0; i--) {
      const j = this.next() % (i + 1);
      const tmp = copy[i];
      copy[i] = copy[j]!;
      copy[j] = tmp!;
    }
    return copy.slice(0, safeN);
  }
}
