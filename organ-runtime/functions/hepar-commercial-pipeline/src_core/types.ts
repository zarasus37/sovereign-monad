export type OrganName =
  | 'Cardia'
  | 'Pneuma'
  | 'Hepar'
  | 'Cortex'
  | 'Synapse'
  | 'Vox';

export type RuntimeMode = 'analysis' | 'paper' | 'live';

export interface OrganDefinition {
  name: OrganName;
  biologicalAnalog: string;
  ecosystemRole: string;
  primaryOutput: string;
  dependencies: OrganName[];
  capitalRequired: boolean;
}

export interface OrganRuntimeUnitConfig {
  enabled: boolean;
  capitalRequired: boolean;
  buildReady: boolean;
  notes: string[];
}

export interface OrganRuntimeConfig {
  runtimeMode: RuntimeMode;
  organs: Record<OrganName, OrganRuntimeUnitConfig>;
  coordination: {
    primaryLoop: OrganName[];
    allowCapitalGatedOrgansInAnalysis: boolean;
  };
  synapse?: {
    sampleSignals?: SynapseSignal[];
  };
  synapseAdaptive?: {
    sampleSignals?: SynapseAdaptiveSignal[];
    sampleSourceHealth?: SynapseSourceHealth[];
    policy?: SynapseAdaptivePolicy;
  };
  hepar?: {
    sampleOpportunities?: HeparOpportunity[];
  };
  heparConsensus?: {
    sampleCampaigns?: HeparConsensusCampaign[];
  };
  cortex?: {
    sampleResearch?: CortexResearchItem[];
  };
  cortexStrategic?: {
    sampleContexts?: CortexStrategicContext[];
  };
  vox?: {
    sampleRequests?: VoxNarrativeRequest[];
  };
  voxIntelligence?: {
    sampleInputs?: VoxNarrativeInput[];
  };
  pneuma?: {
    sampleLeads?: PneumaLead[];
  };
  pneumaMarket?: {
    sampleOrders?: PneumaOrderIntent[];
    sampleVenueQuotes?: PneumaVenueQuote[];
    sampleCounterparties?: PneumaCounterpartySignal[];
    policy?: PneumaExecutionPolicy;
  };
  cardia?: {
    sampleCapitalState?: CardiaCapitalState;
  };
  cardiaAdaptive?: {
    sampleState?: CardiaAdaptiveState;
    sampleCandidates?: CardiaAllocationCandidate[];
    coefficients?: CardiaAdaptiveCoefficients;
  };
  participation?: {
    sampleActors?: ParticipationActor[];
  };
  mandate?: {
    enabled?: boolean;
    title?: string;
  };
  controls?: {
    homeostasis?: {
      sampleMetrics?: HomeostasisMetric[];
    };
    immune?: {
      sampleIncidents?: ImmuneIncident[];
    };
  };
  revenue?: {
    tier3Operational?: Tier3OperationalMaturity;
  };
}

export interface OrganSnapshot {
  name: OrganName;
  biologicalAnalog: string;
  ecosystemRole: string;
  primaryOutput: string;
  enabled: boolean;
  buildReady: boolean;
  capitalRequired: boolean;
  zeroCapitalReady: boolean;
  blockedReasons: string[];
}

export interface OrganRuntimeSnapshot {
  runtimeMode: RuntimeMode;
  zeroCapitalBuildQueue: OrganName[];
  capitalGatedQueue: OrganName[];
  coordinationLoop: OrganName[];
  organs: OrganSnapshot[];
  synapse?: SynapseRuntimeSnapshot;
  synapseAdaptive?: SynapseAdaptiveRuntimeSnapshot;
  hepar?: HeparRuntimeSnapshot;
  heparConsensus?: HeparConsensusRuntimeSnapshot;
  cortex?: CortexRuntimeSnapshot;
  cortexStrategic?: CortexStrategicRuntimeSnapshot;
  vox?: VoxRuntimeSnapshot;
  voxIntelligence?: VoxNarrativeIntelligenceSnapshot;
  pneuma?: PneumaRuntimeSnapshot;
  pneumaMarket?: PneumaMarketIntelligenceSnapshot;
  cardia?: CardiaRuntimeSnapshot;
  cardiaAdaptive?: CardiaAdaptiveRuntimeSnapshot;
  orchestration?: OrchestrationRuntimeSnapshot;
  participation?: ParticipationRuntimeSnapshot;
  mandate?: MandateRuntimeSnapshot;
  revenue?: RevenueRuntimeSnapshot;
  homeostasis?: HomeostasisRuntimeSnapshot;
  signaling?: SignalingRuntimeSnapshot;
  immune?: ImmuneRuntimeSnapshot;
}

export type SynapseSignalCategory =
  | 'opportunity'
  | 'research'
  | 'narrative'
  | 'growth'
  | 'integrity'
  | 'operations';

export type SynapseSignalSeverity = 'low' | 'medium' | 'high' | 'critical';

export type SynapseLatencyClass = 'slow' | 'normal' | 'urgent' | 'immediate';

export interface SynapseSignal {
  id: string;
  category: SynapseSignalCategory;
  severity: SynapseSignalSeverity;
  latency: SynapseLatencyClass;
  summary: string;
  touchesCapital?: boolean;
  requiresExternalExpression?: boolean;
  tags?: string[];
}

export interface SynapseRouteDecision {
  signalId: string;
  primaryTarget: OrganName;
  supportingTargets: OrganName[];
  justification: string;
  fastPath: boolean;
}

export interface SynapseRuntimeSnapshot {
  implemented: true;
  sampleSignalCount: number;
  routeDecisions: SynapseRouteDecision[];
}

export type SynapseSource = 'Hepar' | 'Cortex' | 'Cardia' | 'Pneuma' | 'Vox' | 'DataRail' | 'Market';

export interface SynapseAdaptiveSignal {
  id: string;
  source: SynapseSource;
  category: SynapseSignalCategory;
  severity: SynapseSignalSeverity;
  confidence: number;
  touchesCapital?: boolean;
  summary: string;
}

export interface SynapseSourceHealth {
  source: SynapseSource;
  precision: number;
  missRate: number;
  stalenessSec: number;
}

export interface SynapseAdaptiveRoute {
  signalId: string;
  primaryTarget: OrganName;
  routeType: 'normal' | 'escalated' | 'blocked';
  confidenceWeight: number;
  action: string;
  reasons: string[];
}

export interface SynapseConflictCase {
  conflictId: string;
  signalIds: string[];
  reason: string;
  arbitrationTarget: 'Cortex' | 'Cardia';
  status: 'escalated' | 'resolved';
}

export interface SynapseAdaptiveRuntimeSnapshot {
  implemented: true;
  signalCount: number;
  escalations: number;
  routes: SynapseAdaptiveRoute[];
  conflicts: SynapseConflictCase[];
  sourceWeights: Record<SynapseSource, number>;
  policyUsed: SynapseAdaptivePolicy;
}

export interface SynapseAdaptivePolicy {
  conflictSeverityGap: number;
  lowConfidenceBlockThreshold: number;
  capitalEscalationMinSeverity: 1 | 2 | 3 | 4;
}

export type RiskBand = 'low' | 'medium' | 'high';

export type HeparAdminKeyModel =
  | 'renounced'
  | 'multisig_timelocked'
  | 'multisig'
  | 'single_key';

export type HeparUpgradeabilityModel = 'immutable' | 'timelocked' | 'unbounded';

export type HeparProxyPattern = 'none' | 'transparent' | 'uups' | 'beacon';

export interface HeparBytecodeSignals {
  uncheckedOwnerDrainFunctions: number;
  hiddenPauseMechanisms: boolean;
  selfdestructReachable: boolean;
  uninitializedProxyImplementation: boolean;
  ownerAddressCount: number;
  ownerConcentrationScore: number;
}

export interface HeparProxyAdminSignals {
  proxyAdminPresent: boolean;
  upgradeAuthorityAddressCount: number;
  upgradeDelayHours: number;
  proxyPattern: HeparProxyPattern;
  beaconChainDepth: number;
  timelockBypassVector: boolean;
}

export interface HeparLpUnlockSignals {
  lpTopHolderConcentrationPct: number;
  daysToMajorUnlock: number;
  majorUnlockPercent: number;
  historicalUnlockViolations: number;
  lpLockerVerified: boolean;
}

export interface HeparWalletTaintSignals {
  taintedFundingLinks: number;
  knownRugLaunchCount: number;
  ponziAssociationCount: number;
  suddenProtocolExposureCount: number;
  coordinatedPatternScore: number;
}

export interface HeparAdversarialSignals {
  maxIntPathVulnerabilities: number;
  flashloanInvariantBreaks: number;
  unexpectedCallOrderBreaks: number;
  soleLpWithdrawalExploit: boolean;
  economicInvariantViolations: number;
  estimatedExploitableLossUsd: number;
}

export interface HeparForensicsSignals {
  bytecode: HeparBytecodeSignals;
  proxyAdmin: HeparProxyAdminSignals;
  lpUnlock: HeparLpUnlockSignals;
  walletTaint: HeparWalletTaintSignals;
  adversarial: HeparAdversarialSignals;
  honeypotProbability: number;
  criticalAuditFindings: number;
  unresolvedIncidents30d: number;
  top10HolderConcentrationPct: number;
  liquidityLockDays: number;
  liquidityLockPercent: number;
  adminKeyModel: HeparAdminKeyModel;
  upgradeability: HeparUpgradeabilityModel;
  privilegedFunctionCount: number;
  oracleDiversityScore: number;
  washTradingScore: number;
  dependencyRiskScore: number;
  counterpartyReputationScore: number;
  contractAgeDays: number;
}

export interface HeparOpportunity {
  id: string;
  venue: string;
  edgeBps: number;
  liquidityScore: number;
  counterpartyRisk: RiskBand;
  structuralRisk: RiskBand;
  opaque: boolean;
  exploitative: boolean;
  summary: string;
  forensics?: Partial<HeparForensicsSignals>;
}

export interface HeparRiskBreakdown {
  toxicityRisk: number;
  governanceControlRisk: number;
  liquidityExitRisk: number;
  marketIntegrityRisk: number;
  dependencyContagionRisk: number;
  attackSurfaceRisk: number;
  aggregateRisk: number;
}

export type HeparConfidence = 'low' | 'medium' | 'high';

export interface HeparDecision {
  opportunityId: string;
  approved: boolean;
  score: number;
  reasons: string[];
  hardBlocks: string[];
  confidence: HeparConfidence;
  riskBreakdown: HeparRiskBreakdown;
}

export interface HeparRuntimeSnapshot {
  implemented: true;
  screenedCount: number;
  approvedCount: number;
  decisions: HeparDecision[];
}

export type HeparFindingSeverity = 'low' | 'medium' | 'high' | 'critical';

export type HeparSymbolicStatus = 'proved_safe' | 'counterexample' | 'unknown';

export type HeparConsensusDecisionBand =
  | 'allow'
  | 'guarded_allow'
  | 'restricted'
  | 'deny'
  | 'hard_block';

export interface HeparAgentFinding {
  vectorId: string;
  title: string;
  severity: HeparFindingSeverity;
  estimatedLossUsd: number;
  reproducible: boolean;
  notes?: string[];
}

export interface HeparAgentRun {
  agentId: string;
  specialty: string;
  pathSamples: number;
  coverage: number;
  findings: HeparAgentFinding[];
}

export interface HeparSymbolicVectorVerdict {
  vectorId: string;
  status: HeparSymbolicStatus;
}

export interface HeparConsensusCampaign {
  id: string;
  protocolId: string;
  codeHash: string;
  agentRuns: HeparAgentRun[];
  symbolicVerdicts?: HeparSymbolicVectorVerdict[];
}

export interface HeparConsensusVector {
  vectorId: string;
  title: string;
  severity: HeparFindingSeverity;
  severityScore: number;
  agentsFound: number;
  totalAgents: number;
  consensusRate: number;
  reproducibilityRate: number;
  symbolicStatus: HeparSymbolicStatus;
  proofTerm: number;
  estimatedLossUsd: number;
  riskContribution: number;
}

export interface HeparConsensusResult {
  campaignId: string;
  protocolId: string;
  codeHash: string;
  totalAgents: number;
  totalSamples: number;
  meanCoverage: number;
  unknownSymbolicRatio: number;
  riskScore: number;
  decisionBand: HeparConsensusDecisionBand;
  consensusConfidence: HeparConfidence;
  vectors: HeparConsensusVector[];
  criticalVectors: string[];
  attestation: {
    heparRunId: string;
    evidenceRoot: string;
    postedOnChain: boolean;
  };
}

export interface HeparConsensusRuntimeSnapshot {
  implemented: true;
  campaignCount: number;
  decisionBandCounts: Record<HeparConsensusDecisionBand, number>;
  results: HeparConsensusResult[];
}

export type CortexAudience = 'internal' | 'operators' | 'buyers' | 'external';

export interface CortexResearchItem {
  id: string;
  title: string;
  summary: string;
  confidence: RiskBand;
  urgency: SynapseLatencyClass;
  monetizable: boolean;
  audience: CortexAudience;
  recommendedOrgans?: OrganName[];
}

export interface CortexBrief {
  sourceId: string;
  title: string;
  thesis: string;
  targetAudience: CortexAudience;
  monetizable: boolean;
  recommendedNextAction: string;
}

export interface CortexRuntimeSnapshot {
  implemented: true;
  sourceCount: number;
  briefs: CortexBrief[];
}

export interface CortexStrategicContext {
  id: string;
  headline: string;
  heparCriticalCount: number;
  marketVolatilityPct: number;
  recentPnlUsd: number;
  agentBehaviorStress: number;
  macroRegime: string;
}

export interface CortexScenario {
  name: string;
  probability: number;
  expectedReturnPct: number;
  drawdownRiskPct: number;
}

export interface CortexRecommendation {
  action: string;
  rationale: string;
  confidence: number;
}

export interface CortexStrategicReport {
  contextId: string;
  headline: string;
  stressIndex: number;
  causalDrivers: string[];
  scenarios: CortexScenario[];
  recommendations: CortexRecommendation[];
}

export interface CortexStrategicRuntimeSnapshot {
  implemented: true;
  contextCount: number;
  averageStressIndex: number;
  reports: CortexStrategicReport[];
}

export type VoxFormat = 'thread' | 'memo' | 'newsletter' | 'briefing';
export type VoxAudience = 'operators' | 'public' | 'buyers' | 'partners';

export interface VoxNarrativeRequest {
  id: string;
  sourceBriefId: string;
  format: VoxFormat;
  audience: VoxAudience;
  urgency: 'normal' | 'fast';
}

export interface VoxNarrativePackage {
  requestId: string;
  sourceBriefId: string;
  headline: string;
  channel: string;
  callToAction: string;
  summary: string;
}

export interface VoxRuntimeSnapshot {
  implemented: true;
  requestCount: number;
  packages: VoxNarrativePackage[];
}

export type VoxNarrativeTruthStatus = 'verified' | 'incomplete' | 'conflicted';

export interface VoxNarrativeInput {
  id: string;
  eventTitle: string;
  facts: string[];
  proofRefs: string[];
  contradictionCount: number;
  audiences: VoxAudience[];
}

export interface VoxAudiencePackage {
  audience: VoxAudience;
  channel: string;
  summary: string;
  truthStatus: VoxNarrativeTruthStatus;
  coherenceWarnings: string[];
  proofRefs: string[];
}

export interface VoxNarrativeIntelligenceSnapshot {
  implemented: true;
  inputCount: number;
  packageCount: number;
  verifiedCount: number;
  conflictedCount: number;
  packages: VoxAudiencePackage[];
}

export type PneumaReadiness = 'cold' | 'warm' | 'ready';

export interface PneumaLead {
  id: string;
  source: string;
  fitScore: number;
  reciprocity: RiskBand;
  readiness: PneumaReadiness;
  needsNarrativePackage: boolean;
  summary: string;
}

export interface PneumaDecision {
  leadId: string;
  accepted: boolean;
  channel: string;
  nextAction: string;
  reasons: string[];
}

export interface PneumaRuntimeSnapshot {
  implemented: true;
  leadCount: number;
  acceptedCount: number;
  decisions: PneumaDecision[];
}

export type PneumaOrderSide = 'buy' | 'sell';
export type PneumaUrgency = 'normal' | 'urgent';
export type CounterpartyRiskBand = 'low' | 'medium' | 'high';

export interface PneumaOrderIntent {
  id: string;
  asset: string;
  side: PneumaOrderSide;
  notionalUsd: number;
  maxSlippageBps: number;
  urgency: PneumaUrgency;
}

export interface PneumaVenueQuote {
  orderId: string;
  venue: string;
  availableUsd: number;
  slippageBps: number;
  feeBps: number;
  latencyMs: number;
  counterparty: string;
}

export interface PneumaCounterpartySignal {
  name: string;
  solvencyRisk: CounterpartyRiskBand;
  settlementReliability: number;
  complianceBlocked: boolean;
}

export interface PneumaExecutionDecision {
  orderId: string;
  accepted: boolean;
  venue?: string;
  allocatedUsd: number;
  expectedCostBps: number;
  reason: string;
}

export interface PneumaMarketIntelligenceSnapshot {
  implemented: true;
  orderCount: number;
  acceptedCount: number;
  fillRatio: number;
  averageCostBps: number;
  decisions: PneumaExecutionDecision[];
  feedbackSignals: string[];
  policyUsed: PneumaExecutionPolicy;
}

export interface PneumaExecutionPolicy {
  urgentLatencyPenaltyDivisor: number;
  normalLatencyPenaltyDivisor: number;
  minSettlementReliability: number;
}

export interface CardiaCapitalLane {
  name: string;
  allocatedPercent: number;
  maxPercent: number;
}

export interface CardiaCapitalState {
  reserveRatioPercent: number;
  minReserveRatioPercent: number;
  deploymentReadiness: 'blocked' | 'bounded' | 'ready';
  lanes: CardiaCapitalLane[];
}

export interface CardiaDecision {
  lane: string;
  healthy: boolean;
  reason: string;
}

export interface CardiaRuntimeSnapshot {
  implemented: true;
  reserveHealthy: boolean;
  deploymentMode: 'analysis_only' | 'bounded_ready' | 'blocked';
  decisions: CardiaDecision[];
}

export interface CardiaAdaptiveState {
  reserveRatioPercent: number;
  minReserveRatioPercent: number;
  portfolioDrawdownPct: number;
  volatilityRegime: 'low' | 'elevated' | 'crash';
  liquidityStress: boolean;
}

export interface CardiaAllocationCandidate {
  id: string;
  protocolId: string;
  heparRiskScore: number;
  expectedReturnPct: number;
  confidence: number;
  requiredCapitalUsd: number;
  currentAllocationUsd: number;
}

export interface CardiaAdaptiveDecision {
  candidateId: string;
  protocolId: string;
  action: 'allocate' | 'reduce' | 'hold' | 'block';
  allocationUsd: number;
  score: number;
  reason: string;
}

export interface CardiaAdaptiveRuntimeSnapshot {
  implemented: true;
  candidateCount: number;
  netAllocationUsd: number;
  blockedCount: number;
  stressActions: string[];
  decisions: CardiaAdaptiveDecision[];
  coefficientsUsed: CardiaAdaptiveCoefficients;
}

export interface CardiaAdaptiveCoefficients {
  returnWeight: number;
  riskPenaltyWeight: number;
  drawdownPenaltyWeight: number;
  elevatedStressPenalty: number;
  crashStressPenalty: number;
  allocateThreshold: number;
  reduceThreshold: number;
  hardBlockRiskScore: number;
}

export interface HomeostasisMetric {
  name: string;
  current: number;
  min: number;
  max: number;
  unit: string;
  correctiveAction: string;
}

export interface HomeostasisBreach {
  name: string;
  current: number;
  range: string;
  correctiveAction: string;
}

export interface HomeostasisRuntimeSnapshot {
  implemented: true;
  healthy: boolean;
  metricCount: number;
  breaches: HomeostasisBreach[];
}

export interface SignalingRuntimeSnapshot {
  implemented: true;
  fastLaneSignalIds: string[];
  slowLaneSignalIds: string[];
}

export type ImmuneIncidentCategory = 'integrity' | 'security' | 'operations' | 'drift';

export interface ImmuneIncident {
  id: string;
  category: ImmuneIncidentCategory;
  severity: SynapseSignalSeverity;
  selfBoundaryViolated: boolean;
  contained: boolean;
  needsRepair: boolean;
  summary: string;
}

export interface ImmuneResponseDecision {
  incidentId: string;
  barrierTriggered: boolean;
  containmentAction: string;
  repairAction: string | null;
}

export interface ImmuneRuntimeSnapshot {
  implemented: true;
  incidentCount: number;
  barrierTriggerCount: number;
  repairQueueCount: number;
  decisions: ImmuneResponseDecision[];
}

export type ParticipationMode =
  | 'ecosystem_native'
  | 'delegated_human'
  | 'operator_override';

export interface ParticipationActor {
  id: string;
  mode: ParticipationMode;
  hasDelegateAgent: boolean;
  canTouchCapital: boolean;
  canOverrideBoundaries: boolean;
  summary: string;
}

export interface ParticipationDecision {
  actorId: string;
  allowedSurface: string;
  blockedReasons: string[];
}

export interface ParticipationRuntimeSnapshot {
  implemented: true;
  actorCount: number;
  decisions: ParticipationDecision[];
}

export interface OrchestrationPhase {
  name: string;
  owner: OrganName;
  dependsOn?: string[];
}

export interface OrchestrationRuntimeSnapshot {
  implemented: true;
  phases: OrchestrationPhase[];
  bottlenecks: string[];
}

export interface MandateRuntimeSnapshot {
  implemented: true;
  title: string;
  status: 'analysis_ready';
  sequence: string[];
  gateChecks: string[];
}

export interface RevenueOffer {
  offerId: string;
  title: string;
  tier: string;
  status: 'ready' | 'developing' | 'blocked';
  monthlyUsdRange: string;
  pricingModel: string;
  launchPriority: number;
  readinessScore: number;
  blockers: string[];
  targetCustomers: string[];
  packaging: string[];
  primaryKpis: string[];
  valueBandUsd: RevenueValueBandUsd;
  unitEconomics: RevenueUnitEconomics;
  prerequisites: string[];
  evidence: string[];
}

export interface RevenueValueBandUsd {
  monthlyLowUsd?: number;
  monthlyHighUsd?: number;
  annualLowUsd?: number;
  annualHighUsd?: number;
}

export interface RevenueUnitEconomics {
  grossMarginClass: 'high' | 'medium' | 'low';
  expectedSalesCycleDays: number;
  onboardingComplexity: 'low' | 'medium' | 'high';
}

export interface Tier3OperationalMaturity {
  automatedReportTemplating: boolean;
  qualityChecklistSignoff: boolean;
  evidencePackagingAutomation: boolean;
  customerPortalEnabled: boolean;
  slaEnabled: boolean;
  targetTurnaroundHours: number;
}

export interface RevenuePortfolioMetrics {
  readyOfferCount: number;
  developingOfferCount: number;
  blockedOfferCount: number;
  weightedReadinessScore: number;
  annualizedReadyLowUsd: number;
  annualizedReadyHighUsd: number;
  annualizedPipelineLowUsd: number;
  annualizedPipelineHighUsd: number;
}

export interface RevenueRuntimeSnapshot {
  implemented: true;
  thesis: string;
  offers: RevenueOffer[];
  recommendedLaunchSequence: string[];
  portfolioMetrics: RevenuePortfolioMetrics;
}
