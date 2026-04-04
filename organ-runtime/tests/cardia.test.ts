import { buildCardiaSnapshot } from '../src/cardia';

describe('buildCardiaSnapshot', () => {
  it('reports bounded readiness when reserves and lanes are healthy', () => {
    const snapshot = buildCardiaSnapshot({
      reserveRatioPercent: 26,
      minReserveRatioPercent: 20,
      deploymentReadiness: 'bounded',
      lanes: [
        { name: 'research-commercialization', allocatedPercent: 18, maxPercent: 25 },
        { name: 'defi-exploration', allocatedPercent: 12, maxPercent: 15 },
      ],
    });

    expect(snapshot.reserveHealthy).toBe(true);
    expect(snapshot.deploymentMode).toBe('analysis_only');
    expect(snapshot.decisions).toEqual([
      {
        lane: 'research-commercialization',
        healthy: true,
        reason: 'allocation 18% remains within max 25%',
      },
      {
        lane: 'defi-exploration',
        healthy: true,
        reason: 'allocation 12% remains within max 15%',
      },
    ]);
  });

  it('blocks readiness when a lane breaches its capital band', () => {
    const snapshot = buildCardiaSnapshot({
      reserveRatioPercent: 14,
      minReserveRatioPercent: 20,
      deploymentReadiness: 'ready',
      lanes: [{ name: 'experimental', allocatedPercent: 22, maxPercent: 15 }],
    });

    expect(snapshot.reserveHealthy).toBe(false);
    expect(snapshot.deploymentMode).toBe('blocked');
    expect(snapshot.decisions[0]).toMatchObject({
      lane: 'experimental',
      healthy: false,
    });
  });
});
