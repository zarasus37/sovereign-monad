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

  return {
    runtimeMode: organRuntime.runtimeMode,
    localAnalysisOnly: true,
    implementedSurfaces: [
      'organ-runtime',
      'signal-layer',
      'oracle-core',
      'gnosis-core',
      'boundary-stress-monitor',
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
    nextFrontier: [
      'data_rail_routing_logic',
      'behavioral_reward_router_scaffold',
      'emergence_observation_prep',
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

  const surfaces = {
    organRuntime,
    signalLayer,
    oracle,
    gnosis,
    boundaryStress,
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
