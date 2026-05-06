import { OrganRuntime } from './runtime';

export { ORGAN_DEFINITIONS } from './organs';
export { buildRuntimeSnapshot } from './coordinator';
export { buildCardiaSnapshot } from './cardia';
export { buildCardiaAdaptiveSnapshot } from './cardia-adaptive';
export {
  buildHomeostasisSnapshot,
  buildImmuneSnapshot,
  buildSignalingSnapshot,
} from './controls';
export { buildCortexSnapshot, synthesizeBrief } from './cortex';
export { buildCortexStrategicSnapshot } from './cortex-strategic';
export { buildHeparConsensusSnapshot } from './hepar-consensus';
export { buildHeparSnapshot, screenOpportunity } from './hepar';
export { buildFirstMandateSnapshot } from './mandate';
export { buildOrchestrationSnapshot } from './orchestration';
export { buildParticipationSnapshot } from './participation';
export { buildPneumaMarketSnapshot } from './pneuma-market';
export { buildPneumaSnapshot, qualifyLead } from './pneuma';
export { buildRevenueSnapshot } from './revenue';
export { buildSynapseAdaptiveSnapshot } from './synapse-adaptive';
export { buildSynapseSnapshot, routeSignal } from './synapse';
export { OrganRuntime } from './runtime';
export { buildVoxNarrativeIntelligenceSnapshot } from './vox-intelligence';
export { buildVoxSnapshot, packageNarrative } from './vox';

// Hepar-core: modular forensic stack (Stages A–D)
export * from './hepar-core';
export type {
  CardiaAdaptiveDecision,
  CardiaAdaptiveCoefficients,
  CardiaAdaptiveRuntimeSnapshot,
  CardiaAdaptiveState,
  CardiaAllocationCandidate,
  CardiaCapitalLane,
  CardiaCapitalState,
  CardiaDecision,
  CardiaRuntimeSnapshot,
  CounterpartyRiskBand,
  CortexAudience,
  CortexBrief,
  CortexRecommendation,
  CortexResearchItem,
  CortexRuntimeSnapshot,
  CortexScenario,
  CortexStrategicContext,
  CortexStrategicReport,
  CortexStrategicRuntimeSnapshot,
  HomeostasisBreach,
  HomeostasisMetric,
  HomeostasisRuntimeSnapshot,
  HeparDecision,
  HeparConfidence,
  HeparBytecodeSignals,
  HeparProxyAdminSignals,
  HeparLpUnlockSignals,
  HeparWalletTaintSignals,
  HeparAdversarialSignals,
  HeparProxyPattern,
  HeparForensicsSignals,
  HeparRiskBreakdown,
  HeparOpportunity,
  HeparRuntimeSnapshot,
  HeparFindingSeverity,
  HeparSymbolicStatus,
  HeparConsensusDecisionBand,
  HeparAgentFinding,
  HeparAgentRun,
  HeparSymbolicVectorVerdict,
  HeparConsensusCampaign,
  HeparConsensusVector,
  HeparConsensusResult,
  HeparConsensusRuntimeSnapshot,
  ImmuneIncident,
  ImmuneIncidentCategory,
  ImmuneResponseDecision,
  ImmuneRuntimeSnapshot,
  MandateRuntimeSnapshot,
  OrganDefinition,
  OrganName,
  OrganRuntimeConfig,
  OrganRuntimeSnapshot,
  OrganSnapshot,
  OrchestrationPhase,
  OrchestrationRuntimeSnapshot,
  ParticipationActor,
  ParticipationDecision,
  ParticipationMode,
  ParticipationRuntimeSnapshot,
  RevenueOffer,
  RevenuePortfolioMetrics,
  RevenueRuntimeSnapshot,
  Tier3OperationalMaturity,
  RevenueUnitEconomics,
  RevenueValueBandUsd,
  PneumaDecision,
  PneumaExecutionDecision,
  PneumaLead,
  PneumaMarketIntelligenceSnapshot,
  PneumaExecutionPolicy,
  PneumaOrderIntent,
  PneumaOrderSide,
  PneumaReadiness,
  PneumaRuntimeSnapshot,
  PneumaUrgency,
  PneumaVenueQuote,
  PneumaCounterpartySignal,
  RuntimeMode,
  SignalingRuntimeSnapshot,
  SynapseAdaptiveRoute,
  SynapseAdaptiveRuntimeSnapshot,
  SynapseAdaptivePolicy,
  SynapseAdaptiveSignal,
  SynapseConflictCase,
  SynapseRouteDecision,
  SynapseRuntimeSnapshot,
  SynapseSource,
  SynapseSourceHealth,
  SynapseSignal,
  SynapseSignalCategory,
  SynapseSignalSeverity,
  SynapseLatencyClass,
  VoxAudience,
  VoxAudiencePackage,
  VoxFormat,
  VoxNarrativeInput,
  VoxNarrativePackage,
  VoxNarrativeIntelligenceSnapshot,
  VoxNarrativeRequest,
  VoxNarrativeTruthStatus,
  VoxRuntimeSnapshot,
} from './types';

function main() {
  const runtime = new OrganRuntime();
  const snapshot = runtime.run();
  process.stdout.write(`${JSON.stringify(snapshot, null, 2)}\n`);
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(message);
    process.exitCode = 1;
  }
}
