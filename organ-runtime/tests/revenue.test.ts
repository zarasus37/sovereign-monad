import { buildRevenueSnapshot } from '../src/revenue';

describe('buildRevenueSnapshot', () => {
  it('prioritizes near-term revenue lanes and keeps underwriting blocked until dataset depth exists', () => {
    const snapshot = buildRevenueSnapshot({
      hepar: {
        implemented: true,
        screenedCount: 12,
        approvedCount: 4,
        decisions: [],
      },
      cortex: {
        implemented: true,
        sourceCount: 2,
        briefs: [
          {
            sourceId: 'b1',
            title: 'brief',
            thesis: 'x',
            targetAudience: 'buyers',
            monetizable: true,
            recommendedNextAction: 'sell',
          },
        ],
      },
      vox: {
        implemented: true,
        requestCount: 1,
        packages: [
          {
            requestId: 'v1',
            sourceBriefId: 'b1',
            headline: 'h',
            channel: 'newsletter',
            callToAction: 'cta',
            summary: 's',
          },
        ],
      },
      pneuma: {
        implemented: true,
        leadCount: 4,
        acceptedCount: 3,
        decisions: [],
      },
      cardia: {
        implemented: true,
        reserveHealthy: true,
        deploymentMode: 'bounded_ready',
        decisions: [],
      },
    });

    expect(snapshot.implemented).toBe(true);
    expect(snapshot.offers.some((offer) => offer.offerId === 'tier1-hepar-risk-api' && offer.status === 'ready')).toBe(true);
    expect(snapshot.offers.some((offer) => offer.offerId === 'tier3-forensic-prelaunch-report' && offer.status === 'ready')).toBe(true);
    expect(snapshot.offers.some((offer) => offer.offerId === 'tier4-insurance-underwriting-dataset' && offer.status === 'blocked')).toBe(true);
    expect(snapshot.portfolioMetrics.readyOfferCount).toBe(4);
    expect(snapshot.recommendedLaunchSequence[0]).toBe('tier1-hepar-risk-api');
    expect(
      snapshot.recommendedLaunchSequence.indexOf('tier4-insurance-underwriting-dataset'),
    ).toBeLessThan(
      snapshot.recommendedLaunchSequence.indexOf('organ-native-compound-revenue-loop'),
    );
  });

  it('unlocks insurance-tier readiness when longitudinal coverage and distribution depth are present', () => {
    const snapshot = buildRevenueSnapshot({
      hepar: {
        implemented: true,
        screenedCount: 120,
        approvedCount: 34,
        decisions: [],
      },
      cortex: {
        implemented: true,
        sourceCount: 6,
        briefs: [
          { sourceId: 'b1', title: 'b1', thesis: 'x', targetAudience: 'buyers', monetizable: true, recommendedNextAction: 'sell' },
          { sourceId: 'b2', title: 'b2', thesis: 'x', targetAudience: 'buyers', monetizable: true, recommendedNextAction: 'sell' },
          { sourceId: 'b3', title: 'b3', thesis: 'x', targetAudience: 'buyers', monetizable: true, recommendedNextAction: 'sell' },
          { sourceId: 'b4', title: 'b4', thesis: 'x', targetAudience: 'buyers', monetizable: true, recommendedNextAction: 'sell' },
        ],
      },
      vox: {
        implemented: true,
        requestCount: 5,
        packages: [
          { requestId: 'v1', sourceBriefId: 'b1', headline: 'h', channel: 'newsletter', callToAction: 'cta', summary: 's' },
          { requestId: 'v2', sourceBriefId: 'b2', headline: 'h', channel: 'newsletter', callToAction: 'cta', summary: 's' },
          { requestId: 'v3', sourceBriefId: 'b3', headline: 'h', channel: 'newsletter', callToAction: 'cta', summary: 's' },
          { requestId: 'v4', sourceBriefId: 'b4', headline: 'h', channel: 'newsletter', callToAction: 'cta', summary: 's' },
        ],
      },
      pneuma: {
        implemented: true,
        leadCount: 10,
        acceptedCount: 6,
        decisions: [],
      },
      cardia: {
        implemented: true,
        reserveHealthy: true,
        deploymentMode: 'bounded_ready',
        decisions: [],
      },
    });

    const tier4 = snapshot.offers.find((offer) => offer.offerId === 'tier4-insurance-underwriting-dataset');
    expect(tier4?.status).toBe('ready');
    expect(tier4?.readinessScore).toBeGreaterThanOrEqual(70);
    expect(snapshot.portfolioMetrics.annualizedReadyLowUsd).toBeGreaterThan(0);
  });

  it('pushes Tier 3 readiness into 95+ when operational polish is enabled', () => {
    const base = buildRevenueSnapshot({
      hepar: {
        implemented: true,
        screenedCount: 2,
        approvedCount: 1,
        decisions: [],
      },
      cortex: {
        implemented: true,
        sourceCount: 1,
        briefs: [
          {
            sourceId: 'b1',
            title: 'brief',
            thesis: 'x',
            targetAudience: 'buyers',
            monetizable: true,
            recommendedNextAction: 'sell',
          },
        ],
      },
      vox: {
        implemented: true,
        requestCount: 2,
        packages: [
          {
            requestId: 'v1',
            sourceBriefId: 'b1',
            headline: 'h',
            channel: 'newsletter',
            callToAction: 'cta',
            summary: 's',
          },
          {
            requestId: 'v2',
            sourceBriefId: 'b1',
            headline: 'h2',
            channel: 'briefing',
            callToAction: 'cta',
            summary: 's2',
          },
        ],
      },
      pneuma: {
        implemented: true,
        leadCount: 2,
        acceptedCount: 1,
        decisions: [],
      },
      cardia: {
        implemented: true,
        reserveHealthy: true,
        deploymentMode: 'bounded_ready',
        decisions: [],
      },
    });

    const polished = buildRevenueSnapshot({
      hepar: {
        implemented: true,
        screenedCount: 2,
        approvedCount: 1,
        decisions: [],
      },
      cortex: {
        implemented: true,
        sourceCount: 1,
        briefs: [
          {
            sourceId: 'b1',
            title: 'brief',
            thesis: 'x',
            targetAudience: 'buyers',
            monetizable: true,
            recommendedNextAction: 'sell',
          },
        ],
      },
      vox: {
        implemented: true,
        requestCount: 2,
        packages: [
          {
            requestId: 'v1',
            sourceBriefId: 'b1',
            headline: 'h',
            channel: 'newsletter',
            callToAction: 'cta',
            summary: 's',
          },
          {
            requestId: 'v2',
            sourceBriefId: 'b1',
            headline: 'h2',
            channel: 'briefing',
            callToAction: 'cta',
            summary: 's2',
          },
        ],
      },
      pneuma: {
        implemented: true,
        leadCount: 2,
        acceptedCount: 1,
        decisions: [],
      },
      cardia: {
        implemented: true,
        reserveHealthy: true,
        deploymentMode: 'bounded_ready',
        decisions: [],
      },
      tier3Operational: {
        automatedReportTemplating: true,
        qualityChecklistSignoff: true,
        evidencePackagingAutomation: true,
        customerPortalEnabled: true,
        slaEnabled: true,
        targetTurnaroundHours: 24,
      },
    });

    const baseTier3 = base.offers.find((offer) => offer.offerId === 'tier3-forensic-prelaunch-report');
    const polishedTier3 = polished.offers.find((offer) => offer.offerId === 'tier3-forensic-prelaunch-report');
    expect(baseTier3).toBeDefined();
    expect(polishedTier3).toBeDefined();
    expect(polishedTier3!.readinessScore).toBeGreaterThan(baseTier3!.readinessScore);
    expect(polishedTier3!.readinessScore).toBeGreaterThanOrEqual(95);
    expect(polishedTier3!.monthlyUsdRange).toContain('$5k basic');
  });
});
