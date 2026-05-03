// hepar-core/index.ts
// Main export surface for hepar-core package

// Orchestrator
export { HeparOrchestrator, createDefaultHeparOrchestrator } from './HeparOrchestrator';
export type { HeparOrchestratorConfig, HeparPipelineResult } from './HeparOrchestrator';

// Stages
export { StageA } from './stages/stageA-static';
export type { StageAResult, StageAConfig, StaticFinding } from './stages/stageA-static';

export { StageB } from './stages/stageB-symbolic';
export type { StageBResult, StageBConfig, InvariantViolation, SymbolicConstraint } from './stages/stageB-symbolic';

export { StageC } from './stages/stageC-montecarlo';
export type { ExecutionTrace, StageCResult, StageCConfig } from './stages/stageC-montecarlo';

export { StageD } from './stages/stageD-consensus';
export type { StageDResult, StageDConfig, DecisionVote } from './stages/stageD-consensus';

// Types
export type {
  SymbolicResult,
  ActionBand,
  FindingVector,
  AttestationPayload,
} from './types/hepar.types';

// Utilities and constants
export type { AgentId, AgentFinding, AgentCampaignResult, AgentExecutor, FindingTemplate } from './stages/stageC-utils';
export { SeededLCG, deriveAgentSeed, hashToNumber } from './stages/stageC-utils';

// Agents
export { createAgentExecutor, createAgentRegistry } from './agents/index';
export {
  HeparPrivilegeAgent,
  HeparArithmeticAgent,
  HeparReentrancyAgent,
  HeparEconomicAgent,
  HeparStateAgent,
} from './agents/index';
