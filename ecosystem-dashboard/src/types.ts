export interface EcosystemStateSummary {
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
    organRuntime: {
      organs: Array<{
        name: string;
        biologicalAnalog: string;
        ecosystemRole: string;
        primaryOutput: string;
        zeroCapitalReady: boolean;
        capitalRequired: boolean;
        blockedReasons: string[];
      }>;
      orchestration?: {
        phases: Array<{ name: string; owner: string; dependsOn?: string[] }>;
        bottlenecks: string[];
      };
      mandate?: {
        title: string;
        status: string;
        sequence: string[];
        gateChecks: string[];
      };
    };
    signalLayer: {
      normalizedCount: number;
      interpretations: Array<{ label: string; level: string; reason?: string }>;
    };
    oracle: {
      regime: string;
      confidence: string;
      deploymentPosture: string;
      commercializationPosture: string;
      reasons: string[];
    };
    gnosis: {
      integrityStatus: string;
      decompressionStatus: string;
      hollowConvergenceRisk: string;
      boundaryStress: string;
      reviewFlags: string[];
      reasons: string[];
    };
    boundaryStress: {
      sheathPressure: string;
      turbulence: string;
      escalationTier: string;
      reviewRequired: boolean;
      pauseSuggested: boolean;
      reasons: string[];
    };
  };
  summary: EcosystemStateSummary;
}
