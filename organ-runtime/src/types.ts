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
}
