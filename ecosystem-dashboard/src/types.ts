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
    dataRail: {
      normalizedCount: number;
      rewardEligibleCount: number;
      diversityThresholdsDefined: boolean;
    };
    dataRailRouting: {
      routeCount: number;
      externalProductizationBlocked: boolean;
      thresholdsDefined: boolean;
      externalizationAllowed: boolean;
    };
    rewardLedger: {
      entryCount: number;
      balances: Array<{ actorId: string; units: number; entryCount: number }>;
    };
    dataRailGovernance: {
      thresholdsDefined: boolean;
      thresholdsMet: boolean;
      externalizationAllowed: boolean;
      reasons: string[];
      diversity: {
        unmetThresholds: string[];
        metrics: {
          totalEvents: number;
          distinctActors: number;
          actorClassCount: number;
          surfaceCount: number;
          outcomeCount: number;
        };
      };
    };
    populationGrowth: {
      thresholdsMet: boolean;
      gapCount: number;
      gaps: Array<{ dimension: string; reason: string }>;
      recommendations: Array<{ priority: string; action: string }>;
    };
    rightsReview: {
      reviewCaseCount: number;
      blockedCount: number;
      conditionalCount: number;
      manualReviewCount: number;
      cases: Array<{ eventId: string; disposition: string }>;
    };
    externalizationReadiness: {
      status: string;
      blockers: string[];
      checklist: string[];
    };
    emergenceObservation: {
      readiness: string;
      evidenceWindow: string;
      blockedBy: string[];
      nextCollectionTargets: string[];
      markers: Array<{ marker: string; level: string; reasons: string[] }>;
    };
    emergenceBaseline: {
      windowCount: number;
      baselineStatus: string;
      readinessTrend: string;
      continuityTrend: string;
      notes: string[];
    };
  };
  summary: EcosystemStateSummary;
}
