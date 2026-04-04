import { buildHeparSnapshot, screenOpportunity } from '../src/hepar';

describe('screenOpportunity', () => {
  it('approves bounded, liquid, non-opaque opportunities', () => {
    const decision = screenOpportunity({
      id: 'opp-1',
      venue: 'base',
      edgeBps: 18,
      liquidityScore: 80,
      counterpartyRisk: 'low',
      structuralRisk: 'medium',
      opaque: false,
      exploitative: false,
      summary: 'Good candidate',
    });

    expect(decision.approved).toBe(true);
    expect(decision.reasons).toContain('screen passes bounded opportunity criteria');
  });

  it('rejects opaque high-risk opportunities', () => {
    const decision = screenOpportunity({
      id: 'opp-2',
      venue: 'unknown',
      edgeBps: 10,
      liquidityScore: 30,
      counterpartyRisk: 'high',
      structuralRisk: 'high',
      opaque: true,
      exploitative: false,
      summary: 'Bad candidate',
    });

    expect(decision.approved).toBe(false);
    expect(decision.reasons).toContain('opaque structure rejects safe metabolism');
    expect(decision.reasons).toContain('high counterparty risk');
  });
});

describe('buildHeparSnapshot', () => {
  it('counts approved opportunities correctly', () => {
    const snapshot = buildHeparSnapshot([
      {
        id: 'opp-1',
        venue: 'base',
        edgeBps: 18,
        liquidityScore: 80,
        counterpartyRisk: 'low',
        structuralRisk: 'medium',
        opaque: false,
        exploitative: false,
        summary: 'Good candidate',
      },
      {
        id: 'opp-2',
        venue: 'unknown',
        edgeBps: 10,
        liquidityScore: 30,
        counterpartyRisk: 'high',
        structuralRisk: 'high',
        opaque: true,
        exploitative: false,
        summary: 'Bad candidate',
      },
    ]);

    expect(snapshot.screenedCount).toBe(2);
    expect(snapshot.approvedCount).toBe(1);
  });
});
