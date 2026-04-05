import fs from 'fs';
import path from 'path';
import { ExecutionTruthInput, ExecutionTruthPolicy, ExecutionTruthRecord, ExecutionTruthSnapshot } from './types';

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function buildExecutionTruthSnapshot(
  input: ExecutionTruthInput,
  policy: ExecutionTruthPolicy,
): ExecutionTruthSnapshot {
  const blockers: string[] = [];
  const nextActions: string[] = [];

  if (policy.requirePhase1aLiveProof && !input.proofRecord.phase1aLiveProofRecorded) {
    blockers.push('live Phase 1a deployment proof is not recorded');
    nextActions.push('complete the funded Phase 1a deploy retry and write the live proof artifact');
  }

  if (
    policy.requireBootstrapSourceRegistration &&
    !input.proofRecord.bootstrapSourceRegistered
  ) {
    blockers.push('bootstrap approved-source registration is not recorded');
    nextActions.push('run the bootstrap approved-source governance handoff after live Phase 1a proof');
  }

  if (policy.requireRuntimeArtifact && !input.runtimeArtifactReady) {
    blockers.push('runtime execution artifact is not build-ready');
    nextActions.push('restore a buildable runtime execution artifact before guarded-live work resumes');
  }

  if (
    policy.requireProviderStabilityImplementation &&
    !input.providerStabilityImplemented
  ) {
    blockers.push('provider stability implementation is missing');
    nextActions.push('close the provider stability surface before guarded-live execution');
  }

  if (policy.requireGuardedLiveProfile && !input.guardedLiveProfileDefined) {
    blockers.push('guarded-live profile document is missing');
    nextActions.push('keep the funded path blocked until the guarded-live profile stays documented');
  }

  if (
    policy.requireGuardedLiveActivationDoc &&
    !input.guardedLiveActivationDocumented
  ) {
    blockers.push('guarded-live activation document is missing');
    nextActions.push('document exact activation and rollback commands for the first funded session');
  }

  if (policy.requireOperatorRunbook && !input.operatorRunbookDefined) {
    blockers.push('operator runbook is missing');
    nextActions.push('document operator review and rollback behavior');
  }

  const structuralReady = blockers.length === 0;
  let status: ExecutionTruthSnapshot['status'] = 'blocked';

  if (structuralReady) {
    const liveRuntimeGaps: string[] = [];

    if (
      policy.requireObservedGuardedLiveSession &&
      !input.proofRecord.observedGuardedLiveSession
    ) {
      liveRuntimeGaps.push('first guarded-live session has not been observed');
      nextActions.push('run a bounded guarded-live session under operator supervision');
    }

    if (
      policy.requireReceiptTruthValidation &&
      !input.proofRecord.receiptTruthValidated
    ) {
      liveRuntimeGaps.push('receipt truth has not been validated from live execution');
      nextActions.push('reconcile live receipt logs into realized execution truth');
    }

    if (policy.requireIncidentQueueClear && !input.proofRecord.incidentQueueClear) {
      liveRuntimeGaps.push('execution incident queue is not clear');
      nextActions.push('resolve any live execution incident backlog before declaring closure');
    }

    if (liveRuntimeGaps.length === 0) {
      status = 'closed';
    } else {
      status = 'staged';
      blockers.push(...liveRuntimeGaps);
    }
  }

  return {
    implemented: true,
    status,
    phase1aLiveProofRecorded: input.proofRecord.phase1aLiveProofRecorded,
    bootstrapSourceRegistered: input.proofRecord.bootstrapSourceRegistered,
    runtimeArtifactReady: input.runtimeArtifactReady,
    providerStabilityImplemented: input.providerStabilityImplemented,
    guardedLiveProfileDefined: input.guardedLiveProfileDefined,
    guardedLiveActivationDocumented: input.guardedLiveActivationDocumented,
    operatorRunbookDefined: input.operatorRunbookDefined,
    observedGuardedLiveSession: input.proofRecord.observedGuardedLiveSession,
    receiptTruthValidated: input.proofRecord.receiptTruthValidated,
    incidentQueueClear: input.proofRecord.incidentQueueClear,
    blockers,
    nextActions,
    notes: input.proofRecord.notes,
  };
}

export function loadLocalExecutionTruthSnapshot(packageRoot: string): ExecutionTruthSnapshot {
  const policyPath = path.resolve(packageRoot, 'execution-truth-core', 'config', 'policy.json');
  const recordPath = path.resolve(packageRoot, 'execution-truth-core', 'config', 'runtime-proof.json');
  const marketAgentRoot = path.resolve(packageRoot, 'monad-market-agent');

  const policy = readJson<ExecutionTruthPolicy>(policyPath);
  const proofRecord = readJson<ExecutionTruthRecord>(recordPath);

  const runtimeArtifactReady =
    fs.existsSync(path.resolve(marketAgentRoot, 'package.json')) &&
    fs.existsSync(path.resolve(marketAgentRoot, 'src', 'agent.ts'));

  const providerStabilityImplemented =
    fs.existsSync(path.resolve(marketAgentRoot, 'src', 'adapters', 'rpc-utils.ts')) &&
    fs.existsSync(path.resolve(marketAgentRoot, 'src', 'utils', 'concurrency.ts'));

  return buildExecutionTruthSnapshot(
    {
      runtimeArtifactReady,
      providerStabilityImplemented,
      guardedLiveProfileDefined: fs.existsSync(
        path.resolve(packageRoot, 'docs', 'GUARDED-LIVE-PROFILE.md'),
      ),
      guardedLiveActivationDocumented: fs.existsSync(
        path.resolve(packageRoot, 'docs', 'GUARDED-LIVE-ACTIVATION.md'),
      ),
      operatorRunbookDefined: fs.existsSync(
        path.resolve(packageRoot, 'docs', 'OPERATOR-RUNBOOK.md'),
      ),
      proofRecord,
    },
    policy,
  );
}
