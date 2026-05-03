import { PneumaDecision, PneumaLead, PneumaRuntimeSnapshot } from './types';

function channelForLead(lead: PneumaLead): string {
  if (lead.readiness === 'ready') return 'direct-outreach';
  if (lead.needsNarrativePackage) return 'narrative-assisted';
  return 'warming-sequence';
}

export function qualifyLead(lead: PneumaLead): PneumaDecision {
  const reasons: string[] = [];

  if (lead.fitScore >= 70) reasons.push('fit score is strong enough for bounded exchange');
  else reasons.push('fit score is below healthy exchange threshold');

  if (lead.reciprocity === 'high') reasons.push('reciprocity risk is too high');
  if (lead.readiness === 'ready') reasons.push('lead is ready for direct exchange');
  if (lead.needsNarrativePackage) reasons.push('lead needs narrative support before conversion');

  const accepted = lead.fitScore >= 70 && lead.reciprocity !== 'high' && lead.readiness !== 'cold';

  return {
    leadId: lead.id,
    accepted,
    channel: channelForLead(lead),
    nextAction: accepted
      ? lead.needsNarrativePackage
        ? 'route through Vox package and then open direct exchange'
        : 'open direct exchange and qualification thread'
      : 'keep out of direct exchange and re-evaluate later',
    reasons,
  };
}

export function buildPneumaSnapshot(leads: PneumaLead[]): PneumaRuntimeSnapshot {
  const decisions = leads.map(qualifyLead);
  return {
    implemented: true,
    leadCount: leads.length,
    acceptedCount: decisions.filter((decision) => decision.accepted).length,
    decisions,
  };
}
