import fs from 'fs';
import path from 'path';
import requests from '../config/requests.example.json';
import { KeyActivationRequest, KeyDecision, KeyLayerSnapshot, KeyScope } from './types';

const ECOSYSTEM_NATIVE_ALLOWED = new Set<KeyScope>([
  'runtime.observe',
  'signal.route',
  'builder.compose',
  'dashboard.view',
  'research.read',
]);

const DELEGATED_ALLOWED = new Set<KeyScope>([
  'dashboard.view',
  'research.read',
]);

const OPERATOR_ALLOWED = new Set<KeyScope>([
  'dashboard.view',
  'operator.review',
]);

function evaluateScope(request: KeyActivationRequest, scope: KeyScope): { granted: boolean; reason?: string } {
  if (scope === 'capital.touch') {
    return { granted: false, reason: 'capital-touch scopes remain blocked until funded activation is live' };
  }

  if (scope === 'boundary.override') {
    return { granted: false, reason: 'boundary override scopes are not granted through local key activation' };
  }

  if (request.nftRequired) {
    return { granted: false, reason: 'agent NFTs are not implemented yet' };
  }

  switch (request.activationClass) {
    case 'ecosystem_native':
      return ECOSYSTEM_NATIVE_ALLOWED.has(scope)
        ? { granted: true }
        : { granted: false, reason: 'scope is outside ecosystem-native local policy' };
    case 'delegated_human':
      if (!request.delegateAgentPresent) {
        return { granted: false, reason: 'delegated human activation requires a delegate agent' };
      }
      return DELEGATED_ALLOWED.has(scope)
        ? { granted: true }
        : { granted: false, reason: 'scope is outside delegated-human local policy' };
    case 'operator_review':
      return OPERATOR_ALLOWED.has(scope)
        ? { granted: true }
        : { granted: false, reason: 'scope is outside operator review policy' };
    case 'user_linked':
      return { granted: false, reason: 'user-linked activation remains blocked until the live Keys layer exists' };
  }
}

export function evaluateKeyRequest(request: KeyActivationRequest): KeyDecision {
  const grantedScopes: KeyScope[] = [];
  const blockedScopes: Array<{ scope: KeyScope; reason: string }> = [];
  const reasons: string[] = [];

  for (const scope of request.requestedScopes) {
    const decision = evaluateScope(request, scope);
    if (decision.granted) {
      grantedScopes.push(scope);
    } else {
      blockedScopes.push({ scope, reason: decision.reason || 'blocked' });
    }
  }

  if (request.nftRequired) {
    reasons.push('request depends on NFT-backed identity which is not live');
  }

  if (request.activationClass === 'delegated_human' && !request.delegateAgentPresent) {
    reasons.push('delegated human request arrived without a delegate agent');
  }

  const approved = blockedScopes.length === 0;
  const activationMode: KeyDecision['activationMode'] = approved
    ? 'local_scaffold'
    : grantedScopes.length > 0
      ? 'review'
      : 'blocked';

  if (approved) {
    reasons.push('request is inside the current local Keys scaffold');
  }

  return {
    requestId: request.id,
    subjectId: request.subjectId,
    approved,
    activationMode,
    grantedScopes,
    blockedScopes,
    reasons,
  };
}

export function buildKeyLayerSnapshot(
  requestList: KeyActivationRequest[] = requests as KeyActivationRequest[],
): KeyLayerSnapshot {
  const decisions = requestList.map((request) => evaluateKeyRequest(request));

  return {
    implemented: true,
    localAnalysisOnly: true,
    nftInfrastructureLive: false,
    requestCount: requestList.length,
    approvedCount: decisions.filter((decision) => decision.approved).length,
    decisions,
  };
}

export function loadExampleRequests() {
  return JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '..', 'config', 'requests.example.json'), 'utf8'),
  ) as KeyActivationRequest[];
}
