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
  emergenceReadiness: string;
  externalizationReadiness: string;
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
    rightsReview: unknown;
    externalizationReadiness: unknown;
    emergenceObservation: unknown;
    emergenceBaseline: unknown;
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
  loadRightsReviewSnapshot: () => any;
  loadExternalizationReadinessSnapshot: () => any;
  loadEmergenceBaselineSnapshot: () => any;
}

export interface StateApiConfig {
  port: number;
  logLevel: string;
  runtimeConfigPath: string;
  packageRoot: string;
}
