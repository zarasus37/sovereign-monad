import path from 'path';
import { ExternalizationReadinessInput, ExternalizationReadinessSnapshot } from './types';

export function buildExternalizationReadinessSnapshot(
  input: ExternalizationReadinessInput,
): ExternalizationReadinessSnapshot {
  const blockers: string[] = [];
  const clearedGates: string[] = [];

  if (!input.governance.thresholdsMet) {
    blockers.push('population diversity thresholds are not met');
  } else {
    clearedGates.push('population diversity thresholds are met');
  }

  if (!input.governance.externalizationAllowed) {
    blockers.push('governance does not allow externalization yet');
  } else {
    clearedGates.push('governance allows structural externalization');
  }

  if (input.rightsReview.blockedCount > 0) {
    blockers.push('hard-rights review denials still exist');
  }

  if (input.rightsReview.manualReviewCount > 0) {
    blockers.push('manual rights review queue is not empty');
  }

  if (input.rightsReview.openCaseCount === 0) {
    clearedGates.push('rights review queue is resolved');
  }

  if (input.gnosis.integrityStatus !== 'clear') {
    blockers.push('integrity posture is not clear');
  } else {
    clearedGates.push('integrity posture is clear');
  }

  if (input.boundaryStress.pauseSuggested || input.boundaryStress.escalationTier === 'tier2') {
    blockers.push('boundary stress posture is too elevated');
  } else {
    clearedGates.push('boundary stress posture is within bounded activation bands');
  }

  if (input.emergenceObservation.readiness === 'insufficient') {
    blockers.push('emergence observation baseline is too thin');
  } else {
    clearedGates.push('emergence observation baseline is sufficient for activation review');
  }

  let status: ExternalizationReadinessSnapshot['status'] = 'ready';
  if (blockers.length > 0) {
    status = 'blocked';
  } else if (
    input.rightsReview.conditionalCount > 0 ||
    input.boundaryStress.escalationTier === 'tier1' ||
    input.emergenceObservation.readiness === 'forming'
  ) {
    status = 'conditional';
  }

  return {
    implemented: true,
    status,
    blockers,
    clearedGates,
    checklist: [
      'thresholds met',
      'rights review queue resolved',
      'integrity clear',
      'boundary stress not in pause posture',
      'emergence baseline at least forming',
    ],
  };
}

export function loadLocalExternalizationReadinessSnapshot(
  packageRoot: string,
): ExternalizationReadinessSnapshot {
  const governanceModulePath = path.resolve(packageRoot, 'data-rail-governance', 'dist', 'src', 'index.js');
  const rightsModulePath = path.resolve(packageRoot, 'rights-review-core', 'dist', 'index.js');
  const gnosisModulePath = path.resolve(packageRoot, 'gnosis-core', 'dist', 'index.js');
  const boundaryModulePath = path.resolve(packageRoot, 'boundary-stress-monitor', 'dist', 'index.js');
  const emergenceModulePath = path.resolve(packageRoot, 'emergence-observer-core', 'dist', 'index.js');
  const signalModulePath = path.resolve(packageRoot, 'signal-layer', 'dist', 'index.js');
  const oracleModulePath = path.resolve(packageRoot, 'oracle-core', 'dist', 'index.js');
  const organRuntimeModulePath = path.resolve(packageRoot, 'organ-runtime', 'dist', 'index.js');
  const runtimeConfigPath = path.resolve(packageRoot, 'organ-runtime', 'config', 'runtime.json');

  const { loadLocalGovernanceSnapshot } = require(governanceModulePath) as {
    loadLocalGovernanceSnapshot: (packageRoot: string) => any;
  };
  const { loadLocalRightsReviewSnapshot } = require(rightsModulePath) as {
    loadLocalRightsReviewSnapshot: (packageRoot: string) => any;
  };
  const { buildSignalLayerSnapshot } = require(signalModulePath) as {
    buildSignalLayerSnapshot: (signals: any[]) => any;
  };
  const { buildOracleSnapshot } = require(oracleModulePath) as {
    buildOracleSnapshot: (input: any) => any;
  };
  const { buildGnosisSnapshot } = require(gnosisModulePath) as {
    buildGnosisSnapshot: (input: any) => any;
  };
  const { buildBoundaryStressSnapshot } = require(boundaryModulePath) as {
    buildBoundaryStressSnapshot: (input: any) => any;
  };
  const { loadLocalEmergenceObservationSnapshot } = require(emergenceModulePath) as {
    loadLocalEmergenceObservationSnapshot: (packageRoot: string) => any;
  };
  const { buildRuntimeSnapshot } = require(organRuntimeModulePath) as {
    buildRuntimeSnapshot: (config: any) => any;
  };
  const runtimeConfig = require(runtimeConfigPath);

  const governance = loadLocalGovernanceSnapshot(packageRoot);
  const rightsReview = loadLocalRightsReviewSnapshot(packageRoot);
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
        runtime.participation?.decisions?.filter((decision: any) => decision.blockedReasons.length > 0)
          .length || 0,
      operatorOverrideCount:
        runtime.participation?.decisions?.filter(
          (decision: any) => decision.allowedSurface === 'operator_review_surface',
        ).length || 0,
    },
    mandate: {
      title: runtime.mandate?.title || 'Undefined local mandate',
      gateCheckCount: runtime.mandate?.gateChecks?.length || 0,
    },
  });
  const boundaryStress = buildBoundaryStressSnapshot({
    signal: {
      coordinationPressure:
        signal.interpretations.find((item: any) => item.label === 'coordination_pressure')?.level ||
        'stable',
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
        runtime.participation?.decisions?.filter((decision: any) => decision.blockedReasons.length > 0)
          .length || 0,
    },
  });
  const emergence = loadLocalEmergenceObservationSnapshot(packageRoot);

  return buildExternalizationReadinessSnapshot({
    governance: {
      thresholdsMet: governance.thresholdsMet,
      externalizationAllowed: governance.externalizationAllowed,
    },
    rightsReview: {
      blockedCount: rightsReview.blockedCount,
      manualReviewCount: rightsReview.manualReviewCount,
      conditionalCount: rightsReview.conditionalCount,
      openCaseCount: rightsReview.openCaseCount,
    },
    gnosis: {
      integrityStatus: gnosis.integrityStatus,
    },
    boundaryStress: {
      escalationTier: boundaryStress.escalationTier,
      pauseSuggested: boundaryStress.pauseSuggested,
    },
    emergenceObservation: {
      readiness: emergence.readiness,
    },
  });
}
