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
    expect(decision.reasons).toContain('screen passes bounded multi-factor toxicity and control checks');
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

  it('hard-blocks privileged-bytecode and proxy-admin takeover vectors', () => {
    const decision = screenOpportunity({
      id: 'opp-3',
      venue: 'new-protocol',
      edgeBps: 40,
      liquidityScore: 90,
      counterpartyRisk: 'low',
      structuralRisk: 'low',
      opaque: false,
      exploitative: false,
      summary: 'Looks good on surface but control plane is compromised',
      forensics: {
        bytecode: {
          uncheckedOwnerDrainFunctions: 1,
          hiddenPauseMechanisms: true,
          selfdestructReachable: false,
          uninitializedProxyImplementation: false,
          ownerAddressCount: 1,
          ownerConcentrationScore: 95,
        },
        proxyAdmin: {
          proxyAdminPresent: true,
          upgradeAuthorityAddressCount: 1,
          upgradeDelayHours: 0,
          proxyPattern: 'beacon',
          beaconChainDepth: 3,
          timelockBypassVector: true,
        },
        lpUnlock: {
          lpTopHolderConcentrationPct: 85,
          daysToMajorUnlock: 10,
          majorUnlockPercent: 90,
          historicalUnlockViolations: 1,
          lpLockerVerified: false,
        },
        walletTaint: {
          taintedFundingLinks: 1,
          knownRugLaunchCount: 3,
          ponziAssociationCount: 2,
          suddenProtocolExposureCount: 20,
          coordinatedPatternScore: 80,
        },
        adversarial: {
          maxIntPathVulnerabilities: 1,
          flashloanInvariantBreaks: 1,
          unexpectedCallOrderBreaks: 1,
          soleLpWithdrawalExploit: true,
          economicInvariantViolations: 2,
          estimatedExploitableLossUsd: 2_500_000,
        },
      },
    });

    expect(decision.approved).toBe(false);
    expect(decision.hardBlocks).toContain('unchecked_owner_drain_functions');
    expect(decision.hardBlocks).toContain('single_actor_upgrade_with_timelock_bypass');
    expect(decision.hardBlocks).toContain('adversarial_invariant_break_detected');
    expect(decision.riskBreakdown.attackSurfaceRisk).toBeGreaterThan(0);
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
