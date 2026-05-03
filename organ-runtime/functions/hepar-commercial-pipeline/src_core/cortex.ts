import { CortexBrief, CortexResearchItem, CortexRuntimeSnapshot, OrganName } from './types';

function formatNextAction(targets: OrganName[] | undefined, monetizable: boolean): string {
  const targetText = targets && targets.length > 0 ? targets.join(', ') : 'Cortex, Vox';
  if (monetizable) {
    return `Package for ${targetText} and prepare a sellable or distributable brief.`;
  }
  return `Route internally to ${targetText} for coordination and planning.`;
}

export function synthesizeBrief(item: CortexResearchItem): CortexBrief {
  const thesisPrefix =
    item.confidence === 'high'
      ? 'High-confidence finding'
      : item.confidence === 'medium'
        ? 'Actionable research signal'
        : 'Low-confidence exploratory signal';

  const urgencyText =
    item.urgency === 'immediate' || item.urgency === 'urgent'
      ? 'Immediate review required.'
      : 'Standard review cadence is acceptable.';

  return {
    sourceId: item.id,
    title: item.title,
    thesis: `${thesisPrefix}: ${item.summary} ${urgencyText}`.trim(),
    targetAudience: item.audience,
    monetizable: item.monetizable,
    recommendedNextAction: formatNextAction(item.recommendedOrgans, item.monetizable),
  };
}

export function buildCortexSnapshot(items: CortexResearchItem[]): CortexRuntimeSnapshot {
  return {
    implemented: true,
    sourceCount: items.length,
    briefs: items.map(synthesizeBrief),
  };
}
