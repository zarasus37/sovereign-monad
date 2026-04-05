import path from 'path';
import { NarrativeInput, NarrativeSnapshot } from './types';

export function buildNarrativeSnapshot(input: NarrativeInput): NarrativeSnapshot {
  const blockers: string[] = [];
  const distributionTargets = ['internal_dashboard', 'operator_brief'];
  let publicSurfaceStatus: NarrativeSnapshot['publicSurfaceStatus'] = 'internal_surface_ready';

  if (!input.governance.externalizationAllowed) {
    blockers.push('governance does not yet allow external narrative externalization');
  }
  if (input.activationDecision.status !== 'activate') {
    blockers.push(`activation posture is ${input.activationDecision.status}`);
    publicSurfaceStatus = 'bounded_review';
  }
  if (!input.activationDecision.explicitDecisionPresent) {
    blockers.push('explicit narrative activation record is not present');
  }

  if (input.activationDecision.recommendedScope !== 'none') {
    distributionTargets.push(`scope:${input.activationDecision.recommendedScope}`);
  }

  return {
    implemented: true,
    localAnalysisOnly: true,
    infrastructureStatus: 'local_ready',
    publicSurfaceStatus,
    deploymentLive: false,
    headline: `Local ${input.oracle.regime} posture with ${input.gnosis.integrityStatus} integrity across ${input.organRuntime.readyOrgans.length} ready organs`,
    internalMemo: `Deployment posture is ${input.oracle.deploymentPosture}; commercialization posture is ${input.oracle.commercializationPosture}; capital-gated organs: ${input.organRuntime.capitalGatedOrgans.join(', ') || 'none'}.`,
    publicPulse: `The system is locally coherent, structurally bounded, and still holding public expansion inside ${input.activationDecision.recommendedScope} scope.`,
    distributionTargets,
    blockers,
    artifacts: [
      { id: 'narrative-memo', format: 'internal_memo', audience: 'operators', status: 'ready_local' },
      { id: 'narrative-brief', format: 'operator_brief', audience: 'builders', status: 'ready_local' },
      { id: 'narrative-pulse', format: 'public_pulse', audience: 'public', status: publicSurfaceStatus === 'bounded_review' ? 'bounded_review' : 'ready_local' },
    ],
  };
}

export function loadLocalNarrativeSnapshot(packageRoot: string): NarrativeSnapshot {
  const runtimeConfigPath = path.resolve(packageRoot, 'organ-runtime', 'config', 'runtime.json');
  const runtimeConfig = require(runtimeConfigPath);
  const organModulePath = path.resolve(packageRoot, 'organ-runtime', 'dist', 'index.js');
  const signalModulePath = path.resolve(packageRoot, 'signal-layer', 'dist', 'index.js');
  const oracleModulePath = path.resolve(packageRoot, 'oracle-core', 'dist', 'index.js');
  const gnosisModulePath = path.resolve(packageRoot, 'gnosis-core', 'dist', 'index.js');
  const governanceModulePath = path.resolve(packageRoot, 'data-rail-governance', 'dist', 'src', 'index.js');
  const activationModulePath = path.resolve(packageRoot, 'activation-decision-core', 'dist', 'index.js');

  const { buildRuntimeSnapshot } = require(organModulePath) as { buildRuntimeSnapshot: (config: any) => any };
  const { buildSignalLayerSnapshot } = require(signalModulePath) as { buildSignalLayerSnapshot: (signals: any[]) => any };
  const { buildOracleSnapshot } = require(oracleModulePath) as { buildOracleSnapshot: (input: any) => any };
  const { buildGnosisSnapshot } = require(gnosisModulePath) as { buildGnosisSnapshot: (input: any) => any };
  const { loadLocalGovernanceSnapshot } = require(governanceModulePath) as { loadLocalGovernanceSnapshot: (packageRoot: string) => any };
  const { loadLocalActivationDecisionSnapshot } = require(activationModulePath) as { loadLocalActivationDecisionSnapshot: (packageRoot: string) => any };

  const organRuntime = buildRuntimeSnapshot(runtimeConfig);
  const signal = buildSignalLayerSnapshot(runtimeConfig?.synapse?.sampleSignals || []);
  const oracle = buildOracleSnapshot({
    aggregate: signal.aggregate,
    interpretations: signal.interpretations.map(({ label, level }: any) => ({ label, level })),
    executionReadiness: organRuntime?.cardia?.deploymentMode === 'bounded_ready' ? 'ready' : 'bounded',
  });
  const gnosis = buildGnosisSnapshot({
    signal: {
      byDomain: signal.aggregate.byDomain,
      interpretations: signal.interpretations.map(({ label, level }: any) => ({ label, level })),
    },
    oracle,
    participation: {
      actorCount: organRuntime.participation?.actorCount || 0,
      blockedDecisionCount:
        organRuntime.participation?.decisions?.filter((decision: any) => decision.blockedReasons.length > 0).length || 0,
      operatorOverrideCount:
        organRuntime.participation?.decisions?.filter((decision: any) => decision.allowedSurface === 'operator_review_surface').length || 0,
    },
    mandate: {
      title: organRuntime.mandate?.title || 'Undefined local mandate',
      gateCheckCount: organRuntime.mandate?.gateChecks?.length || 0,
    },
  });
  const governance = loadLocalGovernanceSnapshot(packageRoot);
  const activationDecision = loadLocalActivationDecisionSnapshot(packageRoot);

  return buildNarrativeSnapshot({
    organRuntime: {
      readyOrgans: organRuntime.zeroCapitalBuildQueue || [],
      capitalGatedOrgans: organRuntime.capitalGatedQueue || [],
    },
    oracle: {
      regime: oracle.regime,
      deploymentPosture: oracle.deploymentPosture,
      commercializationPosture: oracle.commercializationPosture,
    },
    gnosis: {
      integrityStatus: gnosis.integrityStatus,
    },
    governance: {
      externalizationAllowed: governance.externalizationAllowed,
    },
    activationDecision: {
      status: activationDecision.status,
      recommendedScope: activationDecision.recommendedScope,
      explicitDecisionPresent: activationDecision.explicitDecisionPresent,
    },
  });
}
