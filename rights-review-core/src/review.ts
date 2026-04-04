import path from 'path';
import { RightsReviewCase, RightsReviewSnapshot } from './types';

function classifyCase(reasons: string[]): RightsReviewCase['disposition'] {
  if (reasons.some((reason) => reason.includes('sensitive payload'))) {
    return 'redact_and_retain_internal';
  }

  if (
    reasons.every(
      (reason) =>
        reason.includes('diversity thresholds are defined but not met') ||
        reason.includes('event is not reward-grade under the current internal Data Rail policy'),
    )
  ) {
    return 'eligible_if_thresholds_met';
  }

  if (
    reasons.some((reason) => reason.includes('blocked tags')) ||
    reasons.some((reason) => reason.includes('actor class')) ||
    reasons.some((reason) => reason.includes('surface')) ||
    reasons.some((reason) => reason.includes('outcome'))
  ) {
    return 'deny';
  }

  return 'manual_review';
}

function requiredActionsFor(disposition: RightsReviewCase['disposition']): string[] {
  switch (disposition) {
    case 'deny':
      return ['keep event internal', 'document non-externalizable reason'];
    case 'eligible_if_thresholds_met':
      return ['hold event in internal archive', 're-evaluate after population thresholds are met'];
    case 'redact_and_retain_internal':
      return ['retain only internal record', 'apply redaction workflow before any future review'];
    case 'manual_review':
      return ['escalate to operator review', 'record explicit rights judgment'];
  }
}

export function buildRightsReviewSnapshot(
  decisions: Array<{ eventId: string; allowed: boolean; reasons: string[] }>,
): RightsReviewSnapshot {
  const cases: RightsReviewCase[] = decisions
    .filter((decision) => !decision.allowed)
    .map((decision) => {
      const disposition = classifyCase(decision.reasons);
      return {
        eventId: decision.eventId,
        disposition,
        reasons: decision.reasons,
        requiredActions: requiredActionsFor(disposition),
      };
    });

  return {
    implemented: true,
    reviewCaseCount: cases.length,
    blockedCount: cases.filter((item) => item.disposition === 'deny').length,
    conditionalCount: cases.filter((item) => item.disposition === 'eligible_if_thresholds_met').length,
    manualReviewCount: cases.filter((item) => item.disposition === 'manual_review').length,
    cases,
  };
}

export function loadLocalRightsReviewSnapshot(packageRoot: string): RightsReviewSnapshot {
  const dataRailModulePath = path.resolve(packageRoot, '..', 'data-rail-core', 'dist', 'src', 'index.js');
  const governanceModulePath = path.resolve(
    packageRoot,
    '..',
    'data-rail-governance',
    'dist',
    'src',
    'index.js',
  );

  const { buildDataRailSnapshot, loadExampleEvents } = require(dataRailModulePath) as {
    buildDataRailSnapshot: (events: any[]) => { events: any[] };
    loadExampleEvents: () => any[];
  };
  const { buildGovernanceSnapshot, evaluateExternalizationDecision } = require(governanceModulePath) as {
    buildGovernanceSnapshot: (events: any[]) => any;
    evaluateExternalizationDecision: (
      event: any,
      governance: any,
    ) => { eventId: string; allowed: boolean; reasons: string[] };
  };

  const events = loadExampleEvents();
  const dataRail = buildDataRailSnapshot(events);
  const governance = buildGovernanceSnapshot(dataRail.events);
  const decisions = dataRail.events.map((event: any) =>
    evaluateExternalizationDecision(event, governance),
  );
  return buildRightsReviewSnapshot(decisions);
}
