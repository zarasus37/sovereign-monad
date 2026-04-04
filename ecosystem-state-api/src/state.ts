import fs from 'fs';
import path from 'path';
import { BuilderBundle, EcosystemStateSnapshot, RuntimeConfigPathSet } from './types';

class SharedStateError extends Error {
  code: string;
  statusCode: number;
  details?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    statusCode = 503,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'SharedStateError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

function assertFileExists(filePath: string, code: string, message: string) {
  if (!fs.existsSync(filePath)) {
    throw new SharedStateError(code, message, 503, { path: filePath });
  }
}

function readJsonFile(filePath: string) {
  assertFileExists(filePath, 'runtime_config_missing', 'Runtime config file is missing.');

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    throw new SharedStateError(
      'runtime_config_parse_error',
      'Runtime config file exists but could not be parsed.',
      503,
      {
        path: filePath,
        reason: err instanceof Error ? err.message : String(err),
      },
    );
  }
}

function buildModulePaths(packageRoot: string, runtimeConfigPath: string): RuntimeConfigPathSet {
  return {
    packageRoot,
    runtimeConfigPath,
    organRuntimeModulePath: path.resolve(packageRoot, '..', 'organ-runtime', 'dist', 'index.js'),
    signalLayerModulePath: path.resolve(packageRoot, '..', 'signal-layer', 'dist', 'index.js'),
    oracleCoreModulePath: path.resolve(packageRoot, '..', 'oracle-core', 'dist', 'index.js'),
    gnosisCoreModulePath: path.resolve(packageRoot, '..', 'gnosis-core', 'dist', 'index.js'),
    boundaryStressModulePath: path.resolve(
      packageRoot,
      '..',
      'boundary-stress-monitor',
      'dist',
      'index.js',
    ),
    dataRailCoreModulePath: path.resolve(packageRoot, '..', 'data-rail-core', 'dist', 'src', 'index.js'),
    dataRailRouterModulePath: path.resolve(
      packageRoot,
      '..',
      'data-rail-router',
      'dist',
      'src',
      'index.js',
    ),
    rewardLedgerModulePath: path.resolve(
      packageRoot,
      '..',
      'reward-ledger-core',
      'dist',
      'src',
      'index.js',
    ),
    dataRailGovernanceModulePath: path.resolve(
      packageRoot,
      '..',
      'data-rail-governance',
      'dist',
      'src',
      'index.js',
    ),
    emergenceObserverModulePath: path.resolve(packageRoot, '..', 'emergence-observer-core', 'dist', 'index.js'),
    populationGrowthModulePath: path.resolve(packageRoot, '..', 'population-growth-core', 'dist', 'index.js'),
    rightsReviewModulePath: path.resolve(packageRoot, '..', 'rights-review-core', 'dist', 'index.js'),
    externalizationReadinessModulePath: path.resolve(
      packageRoot,
      '..',
      'externalization-readiness-core',
      'dist',
      'index.js',
    ),
    emergenceBaselineModulePath: path.resolve(
      packageRoot,
      '..',
      'emergence-baseline-core',
      'dist',
      'src',
      'index.js',
    ),
  };
}

function loadBuiltModule<T>(modulePath: string, exportName: string): T {
  assertFileExists(
    modulePath,
    'dependency_build_missing',
    `Required sibling build artifact is missing for ${exportName}.`,
  );

  const loaded = require(modulePath);
  if (!loaded || typeof loaded[exportName] !== 'function') {
    throw new SharedStateError(
      'dependency_export_missing',
      `Built module does not expose ${exportName}.`,
      503,
      { modulePath, exportName },
    );
  }

  return loaded[exportName] as T;
}

export function loadBuilderBundle(packageRoot: string, runtimeConfigPath: string): BuilderBundle {
  const paths = buildModulePaths(packageRoot, runtimeConfigPath);

  return {
    buildRuntimeSnapshot: loadBuiltModule(paths.organRuntimeModulePath, 'buildRuntimeSnapshot'),
    buildSignalLayerSnapshot: loadBuiltModule(
      paths.signalLayerModulePath,
      'buildSignalLayerSnapshot',
    ),
    buildOracleSnapshot: loadBuiltModule(paths.oracleCoreModulePath, 'buildOracleSnapshot'),
    buildGnosisSnapshot: loadBuiltModule(paths.gnosisCoreModulePath, 'buildGnosisSnapshot'),
    buildBoundaryStressSnapshot: loadBuiltModule(
      paths.boundaryStressModulePath,
      'buildBoundaryStressSnapshot',
    ),
    buildDataRailSnapshot: loadBuiltModule(paths.dataRailCoreModulePath, 'buildDataRailSnapshot'),
    buildRoutingSnapshot: loadBuiltModule(paths.dataRailRouterModulePath, 'buildRoutingSnapshot'),
    buildRewardLedgerSnapshot: loadBuiltModule(
      paths.rewardLedgerModulePath,
      'buildRewardLedgerSnapshot',
    ),
    buildGovernanceSnapshot: loadBuiltModule(
      paths.dataRailGovernanceModulePath,
      'buildGovernanceSnapshot',
    ),
    buildEmergenceObservationSnapshot: loadBuiltModule(
      paths.emergenceObserverModulePath,
      'buildEmergenceObservationSnapshot',
    ),
    loadExampleDataRailEvents: loadBuiltModule(paths.dataRailCoreModulePath, 'loadExampleEvents'),
    loadPopulationGrowthSnapshot: () =>
      loadBuiltModule<(packageRoot: string) => any>(
        paths.populationGrowthModulePath,
        'loadLocalPopulationGrowthSnapshot',
      )(packageRoot),
    loadRightsReviewSnapshot: () =>
      loadBuiltModule<(packageRoot: string) => any>(
        paths.rightsReviewModulePath,
        'loadLocalRightsReviewSnapshot',
      )(packageRoot),
    loadExternalizationReadinessSnapshot: () =>
      loadBuiltModule<(packageRoot: string) => any>(
        paths.externalizationReadinessModulePath,
        'loadLocalExternalizationReadinessSnapshot',
      )(packageRoot),
    loadEmergenceBaselineSnapshot: () =>
      loadBuiltModule<(packageRoot: string) => any>(
        paths.emergenceBaselineModulePath,
        'loadLocalEmergenceBaselineSnapshot',
      )(packageRoot),
  };
}

function deriveExecutionReadiness(runtimeSnapshot: any): 'blocked' | 'bounded' | 'ready' {
  switch (runtimeSnapshot?.cardia?.deploymentMode) {
    case 'bounded_ready':
      return 'ready';
    case 'analysis_only':
      return 'bounded';
    default:
      return 'blocked';
  }
}

function summarize(snapshot: EcosystemStateSnapshot['surfaces']): EcosystemStateSnapshot['summary'] {
  const organRuntime = snapshot.organRuntime as any;
  const oracle = snapshot.oracle as any;
  const gnosis = snapshot.gnosis as any;
  const boundaryStress = snapshot.boundaryStress as any;
  const dataRailGovernance = snapshot.dataRailGovernance as any;
  const externalizationReadiness = snapshot.externalizationReadiness as any;
  const emergenceObservation = snapshot.emergenceObservation as any;

  return {
    runtimeMode: organRuntime.runtimeMode,
    localAnalysisOnly: true,
    implementedSurfaces: [
      'organ-runtime',
      'signal-layer',
      'oracle-core',
      'gnosis-core',
      'boundary-stress-monitor',
      'data-rail-core',
      'data-rail-router',
      'reward-ledger-core',
      'data-rail-governance',
      'population-growth-core',
      'rights-review-core',
      'externalization-readiness-core',
      'emergence-observer-core',
      'emergence-baseline-core',
    ],
    zeroCapitalReadyOrgans: organRuntime.zeroCapitalBuildQueue || [],
    capitalGatedOrgans: organRuntime.capitalGatedQueue || [],
    deploymentBlockedByCapital: Array.isArray(organRuntime.capitalGatedQueue)
      ? organRuntime.capitalGatedQueue.length > 0
      : false,
    deploymentPosture: oracle.deploymentPosture,
    commercializationPosture: oracle.commercializationPosture,
    integrityStatus: gnosis.integrityStatus,
    escalationTier: boundaryStress.escalationTier,
    dataRailExternalizationAllowed: dataRailGovernance?.externalizationAllowed || false,
    emergenceReadiness: emergenceObservation?.readiness || 'insufficient',
    externalizationReadiness: externalizationReadiness?.status || 'blocked',
    nextFrontier: [
      'population_growth_execution',
      'rights_review_resolution',
      'externalization_activation_closure',
      'emergence_window_accumulation',
    ],
  };
}

export function buildEcosystemStateFromRuntimeConfig(
  runtimeConfig: any,
  builders: BuilderBundle,
  runtimeConfigPath: string,
  timestampMs = Date.now(),
): EcosystemStateSnapshot {
  const organRuntime = builders.buildRuntimeSnapshot(runtimeConfig);
  const signalLayer = builders.buildSignalLayerSnapshot(runtimeConfig?.synapse?.sampleSignals || []);
  const oracle = builders.buildOracleSnapshot({
    aggregate: signalLayer.aggregate,
    interpretations: signalLayer.interpretations.map(({ label, level }: any) => ({ label, level })),
    executionReadiness: deriveExecutionReadiness(organRuntime),
  });
  const gnosis = builders.buildGnosisSnapshot({
    signal: {
      byDomain: signalLayer.aggregate.byDomain,
      interpretations: signalLayer.interpretations.map(({ label, level }: any) => ({ label, level })),
    },
    oracle,
    participation: {
      actorCount: organRuntime.participation?.actorCount || 0,
      blockedDecisionCount:
        organRuntime.participation?.decisions?.filter((decision: any) => decision.blockedReasons.length > 0)
          .length || 0,
      operatorOverrideCount:
        organRuntime.participation?.decisions?.filter(
          (decision: any) => decision.allowedSurface === 'operator_review_surface',
        ).length || 0,
    },
    mandate: {
      title: organRuntime.mandate?.title || 'Undefined local mandate',
      gateCheckCount: organRuntime.mandate?.gateChecks?.length || 0,
    },
  });
  const boundaryStress = builders.buildBoundaryStressSnapshot({
    signal: {
      coordinationPressure:
        signalLayer.interpretations.find((item: any) => item.label === 'coordination_pressure')
          ?.level || 'stable',
      boundaryTension:
        signalLayer.interpretations.find((item: any) => item.label === 'boundary_tension')?.level ||
        'stable',
      capitalAttention:
        signalLayer.interpretations.find((item: any) => item.label === 'capital_attention')?.level ||
        'stable',
      operatorLoad:
        signalLayer.interpretations.find((item: any) => item.label === 'operator_load')?.level ||
        'stable',
    },
    oracle: {
      regime: oracle.regime,
      deploymentPosture: oracle.deploymentPosture,
    },
    gnosis: {
      integrityStatus: gnosis.integrityStatus,
      hollowConvergenceRisk: gnosis.hollowConvergenceRisk,
      boundaryStress: gnosis.boundaryStress,
    },
    mandate: {
      gateCheckCount: organRuntime.mandate?.gateChecks?.length || 0,
      participationBlockedCount:
        organRuntime.participation?.decisions?.filter((decision: any) => decision.blockedReasons.length > 0)
          .length || 0,
    },
  });
  const dataRailEvents = builders.loadExampleDataRailEvents();
  const dataRail = builders.buildDataRailSnapshot(dataRailEvents);
  const dataRailGovernance = builders.buildGovernanceSnapshot(dataRail.events);
  const dataRailRouting = builders.buildRoutingSnapshot(dataRail.events, {
    internalOnly: dataRail.internalOnly,
    diversityThresholdsDefined: dataRailGovernance.thresholdsDefined,
    externalizationAllowed: dataRailGovernance.externalizationAllowed,
  });
  const routeMap = new Map(
    dataRailRouting.decisions.map((decision: any) => [decision.eventId, decision.approvedDestinations]),
  );
  const rewardBandMap = new Map(dataRail.rewards.map((reward: any) => [reward.eventId, reward.rewardBand]));
  const rewardLedgerInputs = dataRail.events
    .filter((event: any) => {
      const destinations = routeMap.get(event.id);
      return Array.isArray(destinations) && destinations.includes('internal_reward_ledger');
    })
    .map((event: any) => ({
      eventId: event.id,
      actorId: event.actorId,
      actorClass: event.actorClass,
      contributionScore: event.contributionScore,
      rewardEligible: event.rewardEligible,
      rewardBand: rewardBandMap.get(event.id) || 'none',
    }));
  const rewardLedger = builders.buildRewardLedgerSnapshot(rewardLedgerInputs);
  const populationGrowth = builders.loadPopulationGrowthSnapshot();
  const rightsReview = builders.loadRightsReviewSnapshot();
  const externalizationReadiness = builders.loadExternalizationReadinessSnapshot();
  const emergenceObservation = builders.buildEmergenceObservationSnapshot({
    runtime: {
      organCount: organRuntime.organs?.length || 0,
      orchestrationPhaseCount: organRuntime.orchestration?.phases?.length || 0,
      mandateSequenceCount: organRuntime.mandate?.sequence?.length || 0,
      participationActorCount: organRuntime.participation?.actorCount || 0,
    },
    signal: {
      normalizedCount: signalLayer.normalizedCount || 0,
      interpretationCount: signalLayer.interpretations?.length || 0,
    },
    oracle: {
      deploymentPosture: oracle.deploymentPosture,
      commercializationPosture: oracle.commercializationPosture,
    },
    gnosis: {
      integrityStatus: gnosis.integrityStatus,
      hollowConvergenceRisk: gnosis.hollowConvergenceRisk,
    },
    dataRail: {
      normalizedCount: dataRail.normalizedCount,
      rewardEligibleCount: dataRail.rewardEligibleCount,
    },
    governance: {
      thresholdsDefined: dataRailGovernance.thresholdsDefined,
      thresholdsMet: dataRailGovernance.thresholdsMet,
      externalizationAllowed: dataRailGovernance.externalizationAllowed,
    },
  });
  const emergenceBaseline = builders.loadEmergenceBaselineSnapshot();

  const surfaces = {
    organRuntime,
    signalLayer,
    oracle,
    gnosis,
    boundaryStress,
    dataRail,
    dataRailRouting,
    rewardLedger,
    dataRailGovernance,
    populationGrowth,
    rightsReview,
    externalizationReadiness,
    emergenceObservation,
    emergenceBaseline,
  };

  return {
    implemented: true,
    localAnalysisOnly: true,
    timestampMs,
    runtimeConfigPath,
    surfaces,
    summary: summarize(surfaces),
  };
}

export function loadEcosystemState(packageRoot: string, runtimeConfigPath: string): EcosystemStateSnapshot {
  const runtimeConfig = readJsonFile(runtimeConfigPath);
  const builders = loadBuilderBundle(packageRoot, runtimeConfigPath);
  return buildEcosystemStateFromRuntimeConfig(runtimeConfig, builders, runtimeConfigPath);
}

export { SharedStateError };
