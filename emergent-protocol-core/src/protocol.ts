import fs from 'fs';
import path from 'path';
import patternFile from '../config/patterns.example.json';
import {
  EmergentPatternDefinition,
  EmergentProtocolCandidate,
  EmergentProtocolInput,
  EmergentProtocolSnapshot,
} from './types';

const readinessScore = {
  insufficient: 0,
  forming: 1,
  observable: 2,
} as const;

const accumulationScore = {
  collecting: 0,
  review_ready: 1,
  target_met: 2,
} as const;

function classifyPattern(
  pattern: EmergentPatternDefinition,
  input: EmergentProtocolInput,
): EmergentProtocolCandidate {
  const readinessOk =
    readinessScore[input.observation.readiness] >= readinessScore[pattern.minimumReadiness];
  const accumulationOk =
    accumulationScore[input.accumulation.status] >= accumulationScore[pattern.minimumAccumulation];
  const integrityOk = input.gnosis.integrityStatus === pattern.requiresIntegrity;

  if (readinessOk && accumulationOk && integrityOk) {
    return {
      id: pattern.id,
      status: pattern.minimumAccumulation === 'target_met' ? 'validated' : 'candidate',
      reason: `pattern is supported under ${input.observation.readiness} readiness and ${input.accumulation.status} accumulation`,
      downstreamPath: pattern.downstreamPath,
    };
  }

  const reasons = [];
  if (!readinessOk) {
    reasons.push(`readiness below ${pattern.minimumReadiness}`);
  }
  if (!accumulationOk) {
    reasons.push(`accumulation below ${pattern.minimumAccumulation}`);
  }
  if (!integrityOk) {
    reasons.push(`integrity is ${input.gnosis.integrityStatus}`);
  }

  return {
    id: pattern.id,
    status: 'blocked',
    reason: reasons.join('; '),
    downstreamPath: pattern.downstreamPath,
  };
}

export function buildEmergentProtocolSnapshot(
  input: EmergentProtocolInput,
  patterns: EmergentPatternDefinition[],
): EmergentProtocolSnapshot {
  const protocolCandidates = patterns.map((pattern) => classifyPattern(pattern, input));
  const validatedPatternCount = protocolCandidates.filter((candidate) => candidate.status !== 'blocked').length;

  let validationStatus: EmergentProtocolSnapshot['validationStatus'] = 'forming';
  if (validatedPatternCount > 0 && input.accumulation.status === 'review_ready') {
    validationStatus = 'review_ready';
  }
  if (protocolCandidates.some((candidate) => candidate.status === 'validated')) {
    validationStatus = 'validated';
  }

  return {
    implemented: true,
    observationOnly: true,
    patternCount: patterns.length,
    validatedPatternCount,
    validationStatus,
    protocolCandidates,
    downstreamPath: Array.from(
      new Set(
        protocolCandidates
          .filter((candidate) => candidate.status !== 'blocked')
          .map((candidate) => candidate.downstreamPath),
      ),
    ),
    notes: [
      `current Oracle regime: ${input.oracle.regime}`,
      `baseline status: ${input.baseline.baselineStatus} across ${input.baseline.windowCount} windows`,
      'formal protocol activation remains downstream of explicit live validation',
    ],
  };
}

export function loadLocalEmergentProtocolSnapshot(
  packageRoot: string,
): EmergentProtocolSnapshot {
  const observationModulePath = path.resolve(packageRoot, 'emergence-observer-core', 'dist', 'index.js');
  const baselineModulePath = path.resolve(packageRoot, 'emergence-baseline-core', 'dist', 'src', 'index.js');
  const accumulatorModulePath = path.resolve(packageRoot, 'emergence-accumulator-core', 'dist', 'index.js');
  const gnosisModulePath = path.resolve(packageRoot, 'gnosis-core', 'dist', 'index.js');
  const oracleModulePath = path.resolve(packageRoot, 'oracle-core', 'dist', 'index.js');
  const organModulePath = path.resolve(packageRoot, 'organ-runtime', 'dist', 'index.js');
  const signalModulePath = path.resolve(packageRoot, 'signal-layer', 'dist', 'index.js');
  const runtimeConfigPath = path.resolve(packageRoot, 'organ-runtime', 'config', 'runtime.json');
  const patternsPath = path.resolve(packageRoot, 'emergent-protocol-core', 'config', 'patterns.example.json');

  const { loadLocalEmergenceObservationSnapshot } = require(observationModulePath) as { loadLocalEmergenceObservationSnapshot: (packageRoot: string) => any };
  const { loadLocalEmergenceBaselineSnapshot } = require(baselineModulePath) as { loadLocalEmergenceBaselineSnapshot: (packageRoot: string) => any };
  const { loadLocalEmergenceAccumulatorSnapshot } = require(accumulatorModulePath) as { loadLocalEmergenceAccumulatorSnapshot: (packageRoot: string) => any };
  const { buildGnosisSnapshot } = require(gnosisModulePath) as { buildGnosisSnapshot: (input: any) => any };
  const { buildOracleSnapshot } = require(oracleModulePath) as { buildOracleSnapshot: (input: any) => any };
  const { buildRuntimeSnapshot } = require(organModulePath) as { buildRuntimeSnapshot: (config: any) => any };
  const { buildSignalLayerSnapshot } = require(signalModulePath) as { buildSignalLayerSnapshot: (signals: any[]) => any };

  const runtimeConfig = require(runtimeConfigPath);
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

  const patterns = JSON.parse(fs.readFileSync(patternsPath, 'utf8')) as EmergentPatternDefinition[];
  const observation = loadLocalEmergenceObservationSnapshot(packageRoot);
  const baseline = loadLocalEmergenceBaselineSnapshot(packageRoot);
  const accumulation = loadLocalEmergenceAccumulatorSnapshot(packageRoot);

  return buildEmergentProtocolSnapshot(
    {
      observation: {
        readiness: observation.readiness,
        evidenceWindow: observation.evidenceWindow,
      },
      baseline: {
        baselineStatus: baseline.baselineStatus,
        windowCount: baseline.windowCount,
        readinessTrend: baseline.readinessTrend,
      },
      accumulation: {
        status: accumulation.status,
        currentWindowCount: accumulation.currentWindowCount,
        remainingWindowCount: accumulation.remainingWindowCount,
      },
      gnosis: {
        integrityStatus: gnosis.integrityStatus,
      },
      oracle: {
        regime: oracle.regime,
      },
    },
    patterns,
  );
}

export function loadExampleEmergentProtocolSnapshot(): EmergentProtocolSnapshot {
  return buildEmergentProtocolSnapshot(
    {
      observation: {
        readiness: 'observable',
        evidenceWindow: 'forming',
      },
      baseline: {
        baselineStatus: 'stable',
        windowCount: 5,
        readinessTrend: 'improving',
      },
      accumulation: {
        status: 'review_ready',
        currentWindowCount: 5,
        remainingWindowCount: 3,
      },
      gnosis: {
        integrityStatus: 'clear',
      },
      oracle: {
        regime: 'balanced',
      },
    },
    patternFile as EmergentPatternDefinition[],
  );
}
