import path from 'path';
import { GnosisEvaluationInput, GnosisEvaluationSnapshot, OrganIntegrityScore } from './types';

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function scoreOrgan(
  organ: GnosisEvaluationInput['organs'][number],
  input: GnosisEvaluationInput,
): OrganIntegrityScore {
  let score = organ.zeroCapitalReady ? 92 : 76;
  const reasons: string[] = [];

  if (organ.capitalRequired) {
    reasons.push('organ remains capital-gated');
  }
  if (organ.blockedReasons.length > 0) {
    score -= organ.blockedReasons.length * 8;
    reasons.push(...organ.blockedReasons);
  }
  if (input.gnosis.integrityStatus !== 'clear') {
    score -= 10;
    reasons.push(`global integrity status is ${input.gnosis.integrityStatus}`);
  }
  if (input.boundaryStress.escalationTier !== 'tier0') {
    score -= input.boundaryStress.escalationTier === 'tier1' ? 6 : 14;
    reasons.push(`boundary stress is ${input.boundaryStress.escalationTier}`);
  }
  if (input.oracle.deploymentPosture !== 'bounded') {
    score -= 4;
    reasons.push(`deployment posture is ${input.oracle.deploymentPosture}`);
  }

  score = clamp(score, 0, 100);
  let posture: OrganIntegrityScore['posture'] = 'clear';
  if (score < 80) {
    posture = 'watch';
  }
  if (score < 65) {
    posture = 'contain';
  }

  if (reasons.length === 0) {
    reasons.push('organ remains inside bounded local integrity posture');
  }

  return {
    organ: organ.name,
    score,
    posture,
    reasons,
  };
}

export function buildGnosisEvaluationSnapshot(
  input: GnosisEvaluationInput,
): GnosisEvaluationSnapshot {
  const organScores = input.organs.map((organ) => scoreOrgan(organ, input));
  const overallScore =
    organScores.length === 0
      ? 0
      : Math.round(organScores.reduce((sum, item) => sum + item.score, 0) / organScores.length);

  let posture: GnosisEvaluationSnapshot['posture'] = 'clear';
  const reviewReasons: string[] = [];

  if (input.gnosis.integrityStatus !== 'clear') {
    posture = 'contain';
    reviewReasons.push(`global integrity status is ${input.gnosis.integrityStatus}`);
  } else if (overallScore < 80 || input.boundaryStress.escalationTier !== 'tier0') {
    posture = overallScore < 65 ? 'contain' : 'watch';
    reviewReasons.push('organ-level scoring requires active integrity review');
  }

  if (reviewReasons.length === 0) {
    reviewReasons.push('organ-level integrity scoring is within bounded local bands');
  }

  return {
    implemented: true,
    localAnalysisOnly: true,
    evaluationMechanicsImplemented: true,
    overallScore,
    posture,
    organScores,
    reviewReasons,
  };
}

export function loadLocalGnosisEvaluationSnapshot(packageRoot: string): GnosisEvaluationSnapshot {
  const runtimeConfigPath = path.resolve(packageRoot, 'organ-runtime', 'config', 'runtime.json');
  const runtimeConfig = require(runtimeConfigPath);
  const organModulePath = path.resolve(packageRoot, 'organ-runtime', 'dist', 'index.js');
  const signalModulePath = path.resolve(packageRoot, 'signal-layer', 'dist', 'index.js');
  const oracleModulePath = path.resolve(packageRoot, 'oracle-core', 'dist', 'index.js');
  const gnosisModulePath = path.resolve(packageRoot, 'gnosis-core', 'dist', 'index.js');
  const boundaryModulePath = path.resolve(packageRoot, 'boundary-stress-monitor', 'dist', 'index.js');

  const { buildRuntimeSnapshot } = require(organModulePath) as { buildRuntimeSnapshot: (config: any) => any };
  const { buildSignalLayerSnapshot } = require(signalModulePath) as { buildSignalLayerSnapshot: (signals: any[]) => any };
  const { buildOracleSnapshot } = require(oracleModulePath) as { buildOracleSnapshot: (input: any) => any };
  const { buildGnosisSnapshot } = require(gnosisModulePath) as { buildGnosisSnapshot: (input: any) => any };
  const { buildBoundaryStressSnapshot } = require(boundaryModulePath) as { buildBoundaryStressSnapshot: (input: any) => any };

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

  return buildGnosisEvaluationSnapshot({
    organs: runtime.organs || [],
    gnosis: {
      integrityStatus: gnosis.integrityStatus,
    },
    oracle: {
      deploymentPosture: oracle.deploymentPosture,
    },
    boundaryStress: {
      escalationTier: boundaryStress.escalationTier,
    },
  });
}
