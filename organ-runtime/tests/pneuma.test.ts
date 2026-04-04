import { buildPneumaSnapshot, qualifyLead } from '../src/pneuma';

describe('qualifyLead', () => {
  it('accepts ready, high-fit, low-reciprocity leads', () => {
    const decision = qualifyLead({
      id: 'lead-1',
      source: 'referral',
      fitScore: 82,
      reciprocity: 'low',
      readiness: 'ready',
      needsNarrativePackage: false,
      summary: 'Strong fit',
    });

    expect(decision.accepted).toBe(true);
    expect(decision.channel).toBe('direct-outreach');
  });

  it('rejects cold or high-reciprocity leads', () => {
    const decision = qualifyLead({
      id: 'lead-2',
      source: 'unknown',
      fitScore: 76,
      reciprocity: 'high',
      readiness: 'cold',
      needsNarrativePackage: false,
      summary: 'Misaligned lead',
    });

    expect(decision.accepted).toBe(false);
    expect(decision.nextAction).toContain('re-evaluate later');
  });
});

describe('buildPneumaSnapshot', () => {
  it('counts accepted leads correctly', () => {
    const snapshot = buildPneumaSnapshot([
      {
        id: 'lead-1',
        source: 'referral',
        fitScore: 82,
        reciprocity: 'low',
        readiness: 'ready',
        needsNarrativePackage: false,
        summary: 'Strong fit',
      },
      {
        id: 'lead-2',
        source: 'unknown',
        fitScore: 42,
        reciprocity: 'high',
        readiness: 'cold',
        needsNarrativePackage: false,
        summary: 'Weak fit',
      },
    ]);

    expect(snapshot.leadCount).toBe(2);
    expect(snapshot.acceptedCount).toBe(1);
  });
});
