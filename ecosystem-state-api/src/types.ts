export interface RuntimeConfigPathSet {
  packageRoot: string;
  runtimeConfigPath: string;
  organRuntimeModulePath: string;
  signalLayerModulePath: string;
  oracleCoreModulePath: string;
  gnosisCoreModulePath: string;
  boundaryStressModulePath: string;
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
  };
  summary: SharedStateSummary;
}

export interface BuilderBundle {
  buildRuntimeSnapshot: (config: any) => any;
  buildSignalLayerSnapshot: (signals: any[]) => any;
  buildOracleSnapshot: (input: any) => any;
  buildGnosisSnapshot: (input: any) => any;
  buildBoundaryStressSnapshot: (input: any) => any;
}

export interface StateApiConfig {
  port: number;
  logLevel: string;
  runtimeConfigPath: string;
  packageRoot: string;
}
