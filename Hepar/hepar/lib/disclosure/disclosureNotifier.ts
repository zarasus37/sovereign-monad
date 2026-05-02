// disclosureNotifier.ts
// Responsible Disclosure Notification and Publication
// Advisory Tier: fixture-verified only. No live telemetry.
// CONSTRAINT: exploitCodeIncluded is ALWAYS false. Throw if caller attempts to set true.

import type { DisclosureWindow, DisclosureOutcome } from './disclosureTimer';
import type { FindingVector } from '../../types/hepar.types';
import type { RegistryStatus } from '../../types/hepar.types';

export type OutcomePath =
  | 'PROTOCOL_FIXED'
  | 'PROTOCOL_IGNORED'
  | 'PROTOCOL_DISPUTED'
  | 'EXTENSION_GRANTED';

export interface PrivateNotification {
  notificationId: string;
  windowId: string;
  heparRunId: string;
  protocolId: string;
  vectorId: string;
  severity: string;
  contactChannel: string;
  sentAt: number;
  openedAt: number;
  deadlineAt: number;
  // Finding summary — no full exploit code per responsible disclosure policy
  findingType: string;
  severityScore: number;
  confidenceLabel: string;
  evidenceSummary: string;
  // Exploit code is ALWAYS excluded from private notifications
  exploitCodeIncluded: false;
  advisoryTierLabel: 'ADVISORY';
}

export interface OutcomeRecord {
  outcomeId: string;
  windowId: string;
  protocolId: string;
  vectorId: string;
  outcomePath: OutcomePath;
  recordedAt: number;
  registryStatusAtOutcome: RegistryStatus;
  legalReviewRequired: boolean;
  credibilityNote: string;
  resolution?: string;
}

export interface PublicDisclosurePackage {
  packageId: string;
  notificationId: string;
  outcomeId: string;
  protocolId: string;
  vectorId: string;
  severity: string;
  findingType: string;
  evidenceSummary: string;
  outcomePath: OutcomePath;
  timelineMs: number;
  openedAt: number;
  publishedAt: number;
  correctionApplied: boolean;
  correctionId?: string;
  advisoryTierLabel: 'ADVISORY';
}

const CREDIBILITY_NOTES: Record<OutcomePath, string> = {
  PROTOCOL_FIXED: 'Protocol team demonstrated accuracy in assessment and responsiveness in remediation.',
  PROTOCOL_IGNORED: 'Publication proceeds on grounds of honesty and public safety.',
  PROTOCOL_DISPUTED: 'Publication subject to integrity review and dispute resolution.',
  EXTENSION_GRANTED: 'Extension granted in good faith pending remediation.',
};

interface BuildPrivateNotificationOpts {
  exploitCodeIncluded?: boolean;
}

export function buildPrivateNotification(
  window: DisclosureWindow,
  finding: FindingVector,
  contactChannel: string,
  sentAt: number = Date.now(),
  opts?: BuildPrivateNotificationOpts
): PrivateNotification {
  // Hard constraint: exploit code must never be included in notifications
  if (opts?.exploitCodeIncluded === true) {
    throw new Error('EXPLOIT_CODE_PROHIBITED_IN_PRIVATE_NOTIFICATION');
  }

  const notificationId = `PN-${window.windowId}-${sentAt}`;

  return {
    notificationId,
    windowId: window.windowId,
    heparRunId: window.heparRunId,
    protocolId: window.protocolId,
    vectorId: window.vectorId,
    severity: window.severity,
    contactChannel,
    sentAt,
    openedAt: window.openedAt,
    deadlineAt: window.deadlineAt,
    findingType: finding.description ?? `Vector ${finding.vectorId}`,
    severityScore: finding.severity,
    confidenceLabel: finding.convergenceLabel ?? 'UNKNOWN',
    evidenceSummary: finding.exploitPreconditions?.join('; ') ?? 'No precondition summary available.',
    exploitCodeIncluded: false,
    advisoryTierLabel: 'ADVISORY',
  };
}

export function recordOutcome(
  window: DisclosureWindow,
  outcomePath: OutcomePath,
  registryStatus: RegistryStatus,
  recordedAt: number = Date.now(),
  resolution?: string
): OutcomeRecord {
  const outcomeId = `OUT-${window.windowId}-${recordedAt}`;

  // Legal review required if protocol was ignored and registry is RED or BLACK
  const legalReviewRequired =
    outcomePath === 'PROTOCOL_IGNORED' &&
    (registryStatus === 'RED' || registryStatus === 'BLACK');

  const credibilityNote = CREDIBILITY_NOTES[outcomePath];

  return {
    outcomeId,
    windowId: window.windowId,
    protocolId: window.protocolId,
    vectorId: window.vectorId,
    outcomePath,
    recordedAt,
    registryStatusAtOutcome: registryStatus,
    legalReviewRequired,
    credibilityNote,
    resolution,
  };
}

export function isReadyForPublication(outcome: OutcomeRecord): boolean {
  switch (outcome.outcomePath) {
    case 'PROTOCOL_FIXED':
      // Fixed: cleared if no legal review required (registry not RED/BLACK)
      return !outcome.legalReviewRequired;
    case 'PROTOCOL_IGNORED':
      // Ignored: ready only if legal review is NOT required (GREEN/YELLOW registry)
      return !outcome.legalReviewRequired;
    case 'PROTOCOL_DISPUTED':
      // Disputed: cleared for publication only after legal review is complete
      return !outcome.legalReviewRequired;
    case 'EXTENSION_GRANTED':
      // Extension granted: not yet ready for publication
      return false;
    default:
      return false;
  }
}

export function formatPublicDisclosure(
  notification: PrivateNotification,
  outcome: OutcomeRecord,
  correction?: { correctionId: string }
): PublicDisclosurePackage {
  const packageId = `PDP-${notification.notificationId}-${outcome.outcomeId}`;
  const timelineMs = outcome.recordedAt - notification.openedAt;

  return {
    packageId,
    notificationId: notification.notificationId,
    outcomeId: outcome.outcomeId,
    protocolId: notification.protocolId,
    vectorId: notification.vectorId,
    severity: notification.severity,
    findingType: notification.findingType,
    // evidenceSummary is passed through unchanged from notification
    evidenceSummary: notification.evidenceSummary,
    outcomePath: outcome.outcomePath,
    timelineMs,
    openedAt: notification.openedAt,
    publishedAt: outcome.recordedAt,
    correctionApplied: !!correction,
    correctionId: correction?.correctionId,
    advisoryTierLabel: 'ADVISORY',
  };
}
