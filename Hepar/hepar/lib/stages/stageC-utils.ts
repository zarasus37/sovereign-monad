// hepar/lib/stages/stageC-utils.ts
// Shared utilities and types for Stage C Monte Carlo.
// NO imports from stageC-montecarlo or any agent file -- avoids circular deps.

// ---------------------------------------------------------------------------
// Agent identity
// ---------------------------------------------------------------------------

export type AgentId = 'PRIVILEGE' | 'ARITHMETIC' | 'REENTRANCY' | 'ECONOMIC' | 'STATE';

// ---------------------------------------------------------------------------
// Finding templates (per-agent corpus of attack patterns)
// ---------------------------------------------------------------------------

export interface FindingTemplate {
  templateId: string;
  description: string;
  exploitPreconditions: string[];
  estLoss: string;
  baseSeverity: number; // 0-10; stubs cap generated severity at 9
}

// ---------------------------------------------------------------------------
// Agent output types
// ---------------------------------------------------------------------------

export interface AgentFinding {
  vectorId: string;
  agentId: AgentId;
  severity: number;          // 0-10
  description: string;
  exploitPreconditions: string[];
  estLoss: { low: number; high: number };
  reproducibilitySeed: string;
  traceId: string;
  reproScore: number;        // 0-1
  /**
   * CAL-006 pre-condition 1: true when this finding was generated from a stub
   * template that requires live bytecode confirmation before the finding is
   * treated as protocol-specific evidence. PRIV-T03 (storage collision via
   * proxy storage layout) is the initial member of this class.
   *
   * Forward policy: findings with requiresLiveBytecodeConfirmation=true MUST
   * NOT fire escalation rules autonomously until a live bytecode scan confirms
   * the structural precondition exists in the target protocol.
   */
  requiresLiveBytecodeConfirmation?: boolean;
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
  completedAt: number;       // epoch ms
}

// ---------------------------------------------------------------------------
// Executor interface
// ---------------------------------------------------------------------------

export interface AgentExecutor {
  readonly agentId: AgentId;
  run(agentSeed: string, forcedFindings?: AgentFinding[]): AgentCampaignResult;
}

// ---------------------------------------------------------------------------
// Seed utilities
// ---------------------------------------------------------------------------

/**
 * djb2-xor hash: deterministic string -> unsigned 32-bit integer.
 * Used to convert seed strings to numeric seeds for SeededLCG.
 */
export function hashToNumber(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  }
  return h >>> 0;
}

/**
 * Derive a disjoint agent seed from the master seed.
 * Format: `${masterSeed}:agent${agentIndex}:${protocolId}`
 * Agents 0-4 map to PRIVILEGE/ARITHMETIC/REENTRANCY/ECONOMIC/STATE.
 */
export function deriveAgentSeed(
  masterSeed: string,
  agentIndex: number,
  protocolId: string
): string {
  return `${masterSeed}:agent${agentIndex}:${protocolId}`;
}

// ---------------------------------------------------------------------------
// SeededLCG -- Linear Congruential Generator
// Params from Numerical Recipes: a=1664525, c=1013904223, m=2^32
// ---------------------------------------------------------------------------

export class SeededLCG {
  private state: number;

  constructor(seedStr: string) {
    this.state = hashToNumber(seedStr);
  }

  /** Returns next value in [0, 2^32). */
  next(): number {
    // LCG update: state = (a * state + c) mod 2^32
    // Use 32-bit unsigned arithmetic to avoid floating-point drift.
    const a = 1664525;
    const c = 1013904223;
    // Multiply in two parts to stay within safe integer range.
    const lo = (this.state & 0xffff) * a;
    const hi = ((this.state >>> 16) * a) & 0xffff;
    this.state = ((lo + (hi << 16)) + c) >>> 0;
    return this.state;
  }

  /** Returns integer in [min, max] inclusive. */
  nextInt(min: number, max: number): number {
    const range = max - min + 1;
    return min + (this.next() % range);
  }

  /** Returns float in [min, max). */
  nextFloat(min: number, max: number): number {
    const t = this.next() / 0x100000000;
    return min + t * (max - min);
  }

  /**
   * Pick n elements from arr without replacement using Fisher-Yates partial shuffle.
   * Always performs arr.length-1 shuffle steps regardless of n to keep call count
   * deterministic (important for reproducibility across different n values).
   */
  pickN<T>(arr: T[], n: number): T[] {
    const copy = arr.slice();
    const len = copy.length;
    const safeN = Math.min(n, len);
    // Always shuffle all positions to keep RNG call count constant.
    for (let i = len - 1; i > 0; i--) {
      const j = this.next() % (i + 1);
      const tmp = copy[i];
      copy[i] = copy[j]!;
      copy[j] = tmp!;
    }
    return copy.slice(0, safeN);
  }
}
