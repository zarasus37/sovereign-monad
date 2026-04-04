import fs from 'fs';
import path from 'path';
import {
  EmergenceObservationInput,
  EmergenceObservationSnapshot,
  EmergenceMarkerAssessment,
  MarkerLevel,
} from './types';

function countLevels(markers: EmergenceMarkerAssessment[], level: MarkerLevel) {
  return markers.filter((marker) => marker.level === level).length;
}

function assessRoleDifferentiation(input: EmergenceObservationInput): EmergenceMarkerAssessment {
  if (input.runtime.organCount >= 6 && input.runtime.orchestrationPhaseCount >= 3) {
    return {
      marker: 'role_differentiation',
      level: 'present',
      reasons: ['six-organ set exists with multi-phase orchestration'],
    };
  }

  if (input.runtime.organCount >= 3) {
    return {
      marker: 'role_differentiation',
      level: 'partial',
      reasons: ['multiple roles exist but the organ set is not fully differentiated'],
    };
  }

  return {
    marker: 'role_differentiation',
    level: 'absent',
    reasons: ['not enough distinct organs are active to observe differentiated function'],
  };
}

function assessMutualContribution(input: EmergenceObservationInput): EmergenceMarkerAssessment {
  if (
    input.runtime.mandateSequenceCount >= 4 &&
    input.dataRail.rewardEligibleCount >= 2 &&
    input.signal.normalizedCount >= 4
  ) {
    return {
      marker: 'mutual_contribution',
      level: 'present',
      reasons: ['organs contribute across a bounded loop and contributions are being captured'],
    };
  }

  if (input.runtime.mandateSequenceCount >= 2 && input.dataRail.rewardEligibleCount >= 1) {
    return {
      marker: 'mutual_contribution',
      level: 'partial',
      reasons: ['some mutual contribution exists but the loop is still shallow'],
    };
  }

  return {
    marker: 'mutual_contribution',
    level: 'absent',
    reasons: ['bounded mutual contribution loop is not yet evidenced in the data rail'],
  };
}

function assessAdaptiveFeedback(input: EmergenceObservationInput): EmergenceMarkerAssessment {
  if (
    input.signal.interpretationCount >= 4 &&
    input.oracle.deploymentPosture !== 'unknown' &&
    input.oracle.commercializationPosture !== 'unknown'
  ) {
    return {
      marker: 'adaptive_feedback',
      level: 'present',
      reasons: ['signals are being interpreted and fed into deployment and commercialization posture'],
    };
  }

  if (input.signal.interpretationCount >= 2) {
    return {
      marker: 'adaptive_feedback',
      level: 'partial',
      reasons: ['feedback exists but the posture loop is still thin'],
    };
  }

  return {
    marker: 'adaptive_feedback',
    level: 'absent',
    reasons: ['no meaningful signal-to-posture feedback loop is observable yet'],
  };
}

function assessContinuity(input: EmergenceObservationInput): EmergenceMarkerAssessment {
  if (input.dataRail.normalizedCount >= 8 && input.governance.thresholdsDefined) {
    return {
      marker: 'continuity',
      level: 'present',
      reasons: ['behavioral capture is persistent enough to support longitudinal study'],
    };
  }

  if (input.dataRail.normalizedCount >= 1) {
    return {
      marker: 'continuity',
      level: 'partial',
      reasons: ['behavioral capture exists, but the evidence window is still seed-stage'],
    };
  }

  return {
    marker: 'continuity',
    level: 'absent',
    reasons: ['no behavioral continuity is available for longitudinal observation'],
  };
}

function assessBoundaryIntegrity(input: EmergenceObservationInput): EmergenceMarkerAssessment {
  if (input.gnosis.integrityStatus === 'clear' && input.gnosis.hollowConvergenceRisk === 'low') {
    return {
      marker: 'boundary_integrity',
      level: 'present',
      reasons: ['integrity is clear and hollow convergence risk is low'],
    };
  }

  if (input.gnosis.integrityStatus === 'review' || input.gnosis.hollowConvergenceRisk === 'elevated') {
    return {
      marker: 'boundary_integrity',
      level: 'partial',
      reasons: ['integrity controls are active but still under review pressure'],
    };
  }

  return {
    marker: 'boundary_integrity',
    level: 'absent',
    reasons: ['integrity containment is still too high for a clean emergence observation baseline'],
  };
}

function deriveReadiness(markers: EmergenceMarkerAssessment[]): EmergenceObservationSnapshot['readiness'] {
  const presentCount = countLevels(markers, 'present');
  const partialCount = countLevels(markers, 'partial');
  const boundaryIntegrity = markers.find((marker) => marker.marker === 'boundary_integrity');
  const continuity = markers.find((marker) => marker.marker === 'continuity');

  if (
    presentCount >= 4 &&
    boundaryIntegrity?.level !== 'absent' &&
    continuity?.level !== 'absent'
  ) {
    return 'observable';
  }

  if (presentCount + partialCount >= 3) {
    return 'forming';
  }

  return 'insufficient';
}

export function buildEmergenceObservationSnapshot(
  input: EmergenceObservationInput,
): EmergenceObservationSnapshot {
  const markers = [
    assessRoleDifferentiation(input),
    assessMutualContribution(input),
    assessAdaptiveFeedback(input),
    assessContinuity(input),
    assessBoundaryIntegrity(input),
  ];

  const blockedBy: string[] = [];
  if (!input.governance.thresholdsDefined) {
    blockedBy.push('diversity thresholds are not defined');
  }
  if (!input.governance.thresholdsMet) {
    blockedBy.push('diversity thresholds are not met');
  }
  if (input.dataRail.normalizedCount < 8) {
    blockedBy.push('longitudinal data volume is still seed-stage');
  }
  if (input.gnosis.integrityStatus === 'contain') {
    blockedBy.push('integrity containment is still active');
  }

  return {
    implemented: true,
    observationOnly: true,
    emergenceClaimed: false,
    readiness: deriveReadiness(markers),
    evidenceWindow: 'seed',
    markers,
    blockedBy,
    nextCollectionTargets: [
      'expand behavioral event diversity across more actors and time',
      'record longer continuity windows for mutual contribution loops',
      'reduce integrity containment pressure before interpreting emergent coherence',
    ],
  };
}

export function loadLocalEmergenceObservationSnapshot(packageRoot: string): EmergenceObservationSnapshot {
  const runtimeModulePath = path.resolve(packageRoot, '..', 'organ-runtime', 'dist', 'index.js');
  const signalModulePath = path.resolve(packageRoot, '..', 'signal-layer', 'dist', 'index.js');
  const oracleModulePath = path.resolve(packageRoot, '..', 'oracle-core', 'dist', 'index.js');
  const gnosisModulePath = path.resolve(packageRoot, '..', 'gnosis-core', 'dist', 'index.js');
  const dataRailModulePath = path.resolve(packageRoot, '..', 'data-rail-core', 'dist', 'src', 'core.js');
  const governanceModulePath = path.resolve(
    packageRoot,
    '..',
    'data-rail-governance',
    'dist',
    'src',
    'index.js',
  );
  const runtimeConfigPath = path.resolve(packageRoot, '..', 'organ-runtime', 'config', 'runtime.json');

  const { buildRuntimeSnapshot } = require(runtimeModulePath) as {
    buildRuntimeSnapshot: (config: any) => any;
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
  const { buildDataRailSnapshot, loadExampleEvents } = require(dataRailModulePath) as {
    buildDataRailSnapshot: (events: any[]) => any;
    loadExampleEvents: () => any[];
  };
  const { buildGovernanceSnapshot } = require(governanceModulePath) as {
    buildGovernanceSnapshot: (events: any[]) => any;
  };

  const runtimeConfig = JSON.parse(fs.readFileSync(runtimeConfigPath, 'utf8'));
  const runtimeSnapshot = buildRuntimeSnapshot(runtimeConfig);
  const signalSnapshot = buildSignalLayerSnapshot(runtimeConfig?.synapse?.sampleSignals || []);
  const oracleSnapshot = buildOracleSnapshot({
    aggregate: signalSnapshot.aggregate,
    interpretations: signalSnapshot.interpretations.map(({ label, level }: any) => ({ label, level })),
    executionReadiness:
      runtimeSnapshot?.cardia?.deploymentMode === 'bounded_ready' ? 'ready' : 'bounded',
  });
  const gnosisSnapshot = buildGnosisSnapshot({
    signal: {
      byDomain: signalSnapshot.aggregate.byDomain,
      interpretations: signalSnapshot.interpretations.map(({ label, level }: any) => ({ label, level })),
    },
    oracle: oracleSnapshot,
    participation: {
      actorCount: runtimeSnapshot.participation?.actorCount || 0,
      blockedDecisionCount:
        runtimeSnapshot.participation?.decisions?.filter(
          (decision: any) => decision.blockedReasons.length > 0,
        ).length || 0,
      operatorOverrideCount:
        runtimeSnapshot.participation?.decisions?.filter(
          (decision: any) => decision.allowedSurface === 'operator_review_surface',
        ).length || 0,
    },
    mandate: {
      title: runtimeSnapshot.mandate?.title || 'Undefined local mandate',
      gateCheckCount: runtimeSnapshot.mandate?.gateChecks?.length || 0,
    },
  });

  const exampleEvents = loadExampleEvents();
  const dataRailSnapshot = buildDataRailSnapshot(exampleEvents);
  const governanceSnapshot = buildGovernanceSnapshot(dataRailSnapshot.events);

  return buildEmergenceObservationSnapshot({
    runtime: {
      organCount: runtimeSnapshot.organs?.length || 0,
      orchestrationPhaseCount: runtimeSnapshot.orchestration?.phases?.length || 0,
      mandateSequenceCount: runtimeSnapshot.mandate?.sequence?.length || 0,
      participationActorCount: runtimeSnapshot.participation?.actorCount || 0,
    },
    signal: {
      normalizedCount: signalSnapshot.normalizedCount || 0,
      interpretationCount: signalSnapshot.interpretations?.length || 0,
    },
    oracle: {
      deploymentPosture: oracleSnapshot.deploymentPosture || 'unknown',
      commercializationPosture: oracleSnapshot.commercializationPosture || 'unknown',
    },
    gnosis: {
      integrityStatus: gnosisSnapshot.integrityStatus || 'review',
      hollowConvergenceRisk: gnosisSnapshot.hollowConvergenceRisk || 'elevated',
    },
    dataRail: {
      normalizedCount: dataRailSnapshot.normalizedCount || 0,
      rewardEligibleCount: dataRailSnapshot.rewardEligibleCount || 0,
    },
    governance: {
      thresholdsDefined: governanceSnapshot.thresholdsDefined,
      thresholdsMet: governanceSnapshot.thresholdsMet,
      externalizationAllowed: governanceSnapshot.externalizationAllowed,
    },
  });
}
