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
      metrics: {
        totalEvents: number;
        distinctActors: number;
        actorClassCount: number;
        surfaceCount: number;
        outcomeCount: number;
      };
      gapCount: number;
      gaps: Array<{ dimension: string; reason: string }>;
      recommendations: Array<{ priority: string; action: string }>;
      executedActions: string[];
    };
    populationExpansion: {
      status: string;
      currentMetrics: {
        totalEvents: number;
        distinctActors: number;
        actorClassCount: number;
        surfaceCount: number;
        outcomeCount: number;
      };
      gapCount: number;
      remainingEventCount: number;
      remainingActorCount: number;
      nextWaveTargets: string[];
      plannedWindows: string[];
    };
    rightsReview: {
      reviewCaseCount: number;
      openCaseCount: number;
      resolvedCaseCount: number;
      blockedCount: number;
      conditionalCount: number;
      manualReviewCount: number;
      cases: Array<{ eventId: string; disposition: string; open: boolean; resolution?: string }>;
    };
    externalizationReadiness: {
      status: string;
      blockers: string[];
      clearedGates: string[];
      checklist: string[];
    };
    activationDecision: {
      structurallyEligible: boolean;
      activationAllowed: boolean;
      status: string;
      recommendedScope: string;
      explicitDecisionPresent: boolean;
      reasons: string[];
      pendingActions: string[];
    };
    executionTruth: {
      status: string;
      phase1aLiveProofRecorded: boolean;
      bootstrapSourceRegistered: boolean;
      observedGuardedLiveSession: boolean;
      receiptTruthValidated: boolean;
      incidentQueueClear: boolean;
      blockers: string[];
      nextActions: string[];
    };
    cardiaActivation: {
      status: string;
      executionTruthStatus: string;
      cardiaDeploymentMode: string;
      reserveHealthy: boolean;
      walletFunded: boolean;
      multisigDefined: boolean;
      guardedLiveCapApproved: boolean;
      firstDisbursementExecuted: boolean;
      liveBankrollRouted: boolean;
      recommendedFirstFundingMon: string;
      blockers: string[];
      nextActions: string[];
    };
    publicActivation: {
      status: string;
      executionTruthStatus: string;
      cardiaActivationStatus: string;
      productionInfraConfigured: boolean;
      licensedPrivatePathValidated: boolean;
      operatorMonitoringReady: boolean;
      publicSurfaceReady: boolean;
      activationApproved: boolean;
      publicActivationLive: boolean;
      blockers: string[];
      nextActions: string[];
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
    emergenceAccumulation: {
      status: string;
      currentWindowCount: number;
      targetWindowCount: number;
      remainingWindowCount: number;
      observableWindowCount: number;
      currentStreak: number;
      reasons: string[];
      nextCollectionTargets: string[];
    };
    dao: {
      constitutionVersion: string;
      governanceAgentStatus: string;
      proposalSystemStatus: string;
      handoffControlsStatus: string;
      proposalCount: number;
      acceptedCount: number;
      reviewCount: number;
      deferredCount: number;
      nextActions: string[];
    };
    keysNft: {
      collectionDefined: boolean;
      collectionName: string;
      mintLive: boolean;
      metadataCount: number;
      readyCount: number;
      roleCoverage: string[];
      pendingActions: string[];
    };
    narrative: {
      infrastructureStatus: string;
      publicSurfaceStatus: string;
      deploymentLive: boolean;
      headline: string;
      internalMemo: string;
      publicPulse: string;
      distributionTargets: string[];
      blockers: string[];
    };
    doveIntegration: {
      deployed: boolean;
      observerStatus: string;
      driftStatus: string;
      signalCount: number;
      recommendedActions: string[];
      blockedBy: string[];
    };
    gnosisEvaluation: {
      overallScore: number;
      posture: string;
      organScores: Array<{ organ: string; score: number; posture: string; reasons: string[] }>;
      reviewReasons: string[];
    };
    dataProduct: {
      productizationStatus: string;
      externalActivationLive: boolean;
      recommendedScope: string;
      availableBundles: Array<{ bundleId: string; status: string; reason: string }>;
      blockedBundles: Array<{ bundleId: string; status: string; reason: string }>;
      blockers: string[];
    };
    emergentProtocol: {
      patternCount: number;
      validatedPatternCount: number;
      validationStatus: string;
      protocolCandidates: Array<{ id: string; status: string; reason: string; downstreamPath: string }>;
      downstreamPath: string[];
      notes: string[];
    };
  };
  summary: EcosystemStateSummary;
}
