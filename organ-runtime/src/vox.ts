import { CortexBrief, VoxNarrativePackage, VoxNarrativeRequest, VoxRuntimeSnapshot } from './types';

function channelFor(format: VoxNarrativeRequest['format'], audience: VoxNarrativeRequest['audience']): string {
  if (format === 'newsletter') return 'newsletter';
  if (format === 'memo' || audience === 'operators') return 'operator-memo';
  if (audience === 'buyers' || audience === 'partners') return 'direct-outreach';
  if (format === 'briefing') return 'briefing-room';
  return 'social-thread';
}

function callToActionFor(audience: VoxNarrativeRequest['audience']): string {
  switch (audience) {
    case 'operators':
      return 'Review, validate, and route to the next operational owner.';
    case 'buyers':
      return 'Schedule a briefing or request the full package.';
    case 'partners':
      return 'Open a coordination thread for partnership or distribution fit.';
    case 'public':
      return 'Follow for the full breakdown and future releases.';
  }
}

export function packageNarrative(
  request: VoxNarrativeRequest,
  briefs: CortexBrief[],
): VoxNarrativePackage {
  const sourceBrief = briefs.find((brief) => brief.sourceId === request.sourceBriefId);

  if (!sourceBrief) {
    throw new Error(`Missing Cortex brief for Vox request: ${request.sourceBriefId}`);
  }

  const urgencyPrefix = request.urgency === 'fast' ? 'Fast read' : 'Brief';
  return {
    requestId: request.id,
    sourceBriefId: request.sourceBriefId,
    headline: `${urgencyPrefix}: ${sourceBrief.title}`,
    channel: channelFor(request.format, request.audience),
    callToAction: callToActionFor(request.audience),
    summary: sourceBrief.thesis,
  };
}

export function buildVoxSnapshot(
  requests: VoxNarrativeRequest[],
  briefs: CortexBrief[],
): VoxRuntimeSnapshot {
  return {
    implemented: true,
    requestCount: requests.length,
    packages: requests.map((request) => packageNarrative(request, briefs)),
  };
}
