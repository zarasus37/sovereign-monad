import { HeparDecision, HeparOpportunity, HeparRuntimeSnapshot } from './types';

function penaltyForRisk(risk: 'low' | 'medium' | 'high'): number {
  switch (risk) {
    case 'low':
      return 0;
    case 'medium':
      return 15;
    case 'high':
      return 35;
  }
}

export function screenOpportunity(opportunity: HeparOpportunity): HeparDecision {
  const reasons: string[] = [];
  let score = opportunity.edgeBps + opportunity.liquidityScore / 2;

  score -= penaltyForRisk(opportunity.counterpartyRisk);
  score -= penaltyForRisk(opportunity.structuralRisk);

  if (opportunity.opaque) {
    score -= 40;
    reasons.push('opaque structure rejects safe metabolism');
  }

  if (opportunity.exploitative) {
    score -= 50;
    reasons.push('exploitative posture violates moral boundary');
  }

  if (opportunity.counterpartyRisk === 'high') {
    reasons.push('high counterparty risk');
  }

  if (opportunity.structuralRisk === 'high') {
    reasons.push('high structural risk');
  }

  if (opportunity.liquidityScore < 50) {
    reasons.push('insufficient liquidity quality');
  }

  if (opportunity.edgeBps < 12) {
    reasons.push('insufficient edge for safe deployment');
  }

  const approved =
    !opportunity.opaque &&
    !opportunity.exploitative &&
    opportunity.counterpartyRisk !== 'high' &&
    opportunity.structuralRisk !== 'high' &&
    opportunity.liquidityScore >= 50 &&
    opportunity.edgeBps >= 12 &&
    score >= 35;

  if (approved) {
    reasons.push('screen passes bounded opportunity criteria');
  }

  return {
    opportunityId: opportunity.id,
    approved,
    score,
    reasons,
  };
}

export function buildHeparSnapshot(opportunities: HeparOpportunity[]): HeparRuntimeSnapshot {
  const decisions = opportunities.map(screenOpportunity);
  return {
    implemented: true,
    screenedCount: opportunities.length,
    approvedCount: decisions.filter((decision) => decision.approved).length,
    decisions,
  };
}
