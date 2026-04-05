export interface RuntimeConfigPathSet {
  packageRoot: string;
  runtimeConfigPath: string;
  organRuntimeModulePath: string;
  signalLayerModulePath: string;
  oracleCoreModulePath: string;
  gnosisCoreModulePath: string;
  boundaryStressModulePath: string;
  dataRailCoreModulePath: string;
  dataRailRouterModulePath: string;
  rewardLedgerModulePath: string;
  dataRailGovernanceModulePath: string;
  emergenceObserverModulePath: string;
  populationGrowthModulePath: string;
  rightsReviewModulePath: string;
  externalizationReadinessModulePath: string;
  emergenceBaselineModulePath: string;
  activationDecisionModulePath: string;
  populationExpansionModulePath: string;
  emergenceAccumulatorModulePath: string;
  executionTruthModulePath: string;
  cardiaActivationModulePath: string;
  publicActivationModulePath: string;
  daoCoreModulePath: string;
  keysNftModulePath: string;
  narrativeCoreModulePath: string;
  doveIntegrationModulePath: string;
  gnosisEvaluatorModulePath: string;
  dataProductModulePath: string;
  emergentProtocolModulePath: string;
}

export interface SharedStateSummary {
  runtimeMode: string;
  localAnalysisOnly: true;
  implementedSurfaces: string[];
  zeroCapitalReadyOrgans: string[];
  capitalGatedOrgans: string[];
  deploymentBlockedByCapital: boolean;
  deploymentPosture: string;
  commercializationPosture: string;
  integrityStatus: string;
  escalationTier: string;
  dataRailExternalizationAllowed: boolean;
  dataRailExternalizationActivated: boolean;
  activationDecisionStatus: string;
  phase1aLiveProofRecorded: boolean;
  bootstrapSourceRegistered: boolean;
  executionTruthStatus: string;
  cardiaActivationStatus: string;
  publicActivationStatus: string;
  emergenceReadiness: string;
  externalizationReadiness: string;
  populationExpansionStatus: string;
  emergenceAccumulationStatus: string;
  daoStatus: string;
  narrativeStatus: string;
  keysNftStatus: string;
  doveStatus: string;
  gnosisEvaluationStatus: string;
  dataProductStatus: string;
  emergentProtocolStatus: string;
  nextFrontier: string[];
}

export interface EcosystemStateSnapshot {
  implemented: true;
  localAnalysisOnly: true;
  timestampMs: number;
  runtimeConfigPath: string;
  surfaces: {
    organRuntime: unknown;
    signalLayer: unknown;
    oracle: unknown;
    gnosis: unknown;
    boundaryStress: unknown;
    dataRail: unknown;
    dataRailRouting: unknown;
    rewardLedger: unknown;
    dataRailGovernance: unknown;
    populationGrowth: unknown;
    populationExpansion: unknown;
    rightsReview: unknown;
    externalizationReadiness: unknown;
    activationDecision: unknown;
    executionTruth: unknown;
    cardiaActivation: unknown;
    publicActivation: unknown;
    emergenceObservation: unknown;
    emergenceBaseline: unknown;
    emergenceAccumulation: unknown;
    dao: unknown;
    keysNft: unknown;
    narrative: unknown;
    doveIntegration: unknown;
    gnosisEvaluation: unknown;
    dataProduct: unknown;
    emergentProtocol: unknown;
  };
  summary: SharedStateSummary;
}

export interface BuilderBundle {
  buildRuntimeSnapshot: (config: any) => any;
  buildSignalLayerSnapshot: (signals: any[]) => any;
  buildOracleSnapshot: (input: any) => any;
  buildGnosisSnapshot: (input: any) => any;
  buildBoundaryStressSnapshot: (input: any) => any;
  buildDataRailSnapshot: (events: any[]) => any;
  buildRoutingSnapshot: (events: any[], policy: any) => any;
  buildRewardLedgerSnapshot: (inputs: any[]) => any;
  buildGovernanceSnapshot: (events: any[]) => any;
  buildEmergenceObservationSnapshot: (input: any) => any;
  loadExampleDataRailEvents: () => any[];
  loadPopulationGrowthSnapshot: () => any;
  loadPopulationExpansionSnapshot: () => any;
  loadRightsReviewSnapshot: () => any;
  loadExternalizationReadinessSnapshot: () => any;
  loadActivationDecisionSnapshot: () => any;
  loadExecutionTruthSnapshot: () => any;
  loadCardiaActivationSnapshot: () => any;
  loadPublicActivationSnapshot: () => any;
  loadEmergenceBaselineSnapshot: () => any;
  loadEmergenceAccumulatorSnapshot: () => any;
  loadDaoSnapshot: () => any;
  loadKeysNftSnapshot: () => any;
  loadNarrativeSnapshot: () => any;
  loadDoveIntegrationSnapshot: () => any;
  loadGnosisEvaluationSnapshot: () => any;
  loadDataProductSnapshot: () => any;
  loadEmergentProtocolSnapshot: () => any;
}

export interface StateApiConfig {
  port: number;
  logLevel: string;
  runtimeConfigPath: string;
  packageRoot: string;
}
