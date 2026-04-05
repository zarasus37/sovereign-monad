import path from 'path';
import { DoveIntegrationInput, DoveIntegrationSnapshot } from './types';

export function buildDoveIntegrationSnapshot(
  input: DoveIntegrationInput,
): DoveIntegrationSnapshot {
  const routes = input.signal.interpretations.map((item) => ({
    signal: item.label,
    destination:
      item.level === 'elevated' || item.level === 'high'
        ? 'dove_review_lane'
        : 'dove_observation_lane',
  }));

  const blockedBy: string[] = ['deployed Dove path is not live'];
  const recommendedActions: string[] = [];
  let driftStatus: DoveIntegrationSnapshot['driftStatus'] = 'stable';

  if (
    input.boundaryStress.pauseSuggested ||
    input.boundaryStress.escalationTier === 'tier2' ||
    input.gnosis.integrityStatus === 'contain'
  ) {
    driftStatus = 'contain';
    recommendedActions.push('hold outward expansion and route the signal set into containment review');
  } else if (
    input.gnosis.hollowConvergenceRisk !== 'low' ||
    input.gnosis.boundaryStress !== 'stable' ||
    input.oracle.deploymentPosture !== 'bounded'
  ) {
    driftStatus = 'watch';
    recommendedActions.push('keep the Dove in active watch mode and route flagged signals into operator review');
  } else {
    recommendedActions.push('continue bounded observation with no emergency containment path');
  }

  if (driftStatus !== 'contain') {
    recommendedActions.push('preserve explicit separation between observation, governance, and execution');
  }

  return {
    implemented: true,
    localAnalysisOnly: true,
    deployed: false,
    observerStatus: 'local_ready',
    driftStatus,
    signalCount: routes.length,
    routes,
    recommendedActions,
    blockedBy,
  };
}

export function loadLocalDoveIntegrationSnapshot(packageRoot: string): DoveIntegrationSnapshot {
  const runtimeConfigPath = path.resolve(packageRoot, 'organ-runtime', 'config', 'runtime.json');
  const runtimeConfig = require(runtimeConfigPath);
  const signalModulePath = path.resolve(packageRoot, 'signal-layer', 'dist', 'index.js');
  const oracleModulePath = path.resolve(packageRoot, 'oracle-core', 'dist', 'index.js');
  const gnosisModulePath = path.resolve(packageRoot, 'gnosis-core', 'dist', 'index.js');
  const boundaryModulePath = path.resolve(packageRoot, 'boundary-stress-monitor', 'dist', 'index.js');
  const organModulePath = path.resolve(packageRoot, 'organ-runtime', 'dist', 'index.js');

  const { buildSignalLayerSnapshot } = require(signalModulePath) as { buildSignalLayerSnapshot: (signals: any[]) => any };
  const { buildOracleSnapshot } = require(oracleModulePath) as { buildOracleSnapshot: (input: any) => any };
  const { buildGnosisSnapshot } = require(gnosisModulePath) as { buildGnosisSnapshot: (input: any) => any };
  const { buildBoundaryStressSnapshot } = require(boundaryModulePath) as { buildBoundaryStressSnapshot: (input: any) => any };
  const { buildRuntimeSnapshot } = require(organModulePath) as { buildRuntimeSnapshot: (config: any) => any };

  const runtime = buildRuntimeSnapshot(runtimeConfig);
  const signal = buildSignalLayerSnapshot(runtimeConfig?.synapse?.sampleSignals || []);
  const oracle = buildOracleSnapshot({
    aggregate: signal.aggregate,
    interpretations: signal.interpretations.map(({ label, level }: any) => ({ label, level })),
    executionReadiness: runtime?.cardia?.deploymentMode === 'bounded_ready' ? 'ready' : 'bounded',
  });
  const gnosis = buildGnosisSnapshot({
    signal: {
      byDomain: signal.aggregate.byDomain,
      interpretations: signal.interpretations.map(({ label, level }: any) => ({ label, level })),
    },
    oracle,
    participation: {
      actorCount: runtime.participation?.actorCount || 0,
      blockedDecisionCount:
        runtime.participation?.decisions?.filter((decision: any) => decision.blockedReasons.length > 0).length || 0,
      operatorOverrideCount:
        runtime.participation?.decisions?.filter((decision: any) => decision.allowedSurface === 'operator_review_surface').length || 0,
    },
    mandate: {
      title: runtime.mandate?.title || 'Undefined local mandate',
      gateCheckCount: runtime.mandate?.gateChecks?.length || 0,
    },
  });
  const boundaryStress = buildBoundaryStressSnapshot({
    signal: {
      coordinationPressure:
        signal.interpretations.find((item: any) => item.label === 'coordination_pressure')?.level || 'stable',
      boundaryTension:
        signal.interpretations.find((item: any) => item.label === 'boundary_tension')?.level || 'stable',
      capitalAttention:
        signal.interpretations.find((item: any) => item.label === 'capital_attention')?.level || 'stable',
      operatorLoad:
        signal.interpretations.find((item: any) => item.label === 'operator_load')?.level || 'stable',
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
      gateCheckCount: runtime.mandate?.gateChecks?.length || 0,
      participationBlockedCount:
        runtime.participation?.decisions?.filter((decision: any) => decision.blockedReasons.length > 0).length || 0,
    },
  });

  return buildDoveIntegrationSnapshot({
    signal: {
      interpretations: signal.interpretations.map(({ label, level }: any) => ({ label, level })),
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
    boundaryStress: {
      escalationTier: boundaryStress.escalationTier,
      pauseSuggested: boundaryStress.pauseSuggested,
    },
  });
}
