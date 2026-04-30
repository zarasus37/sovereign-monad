import { buildHeparConsensusSnapshot } from '../src/hepar-consensus';
import { HeparConsensusCampaign } from '../src/types';

function makeHighRiskCampaign(): HeparConsensusCampaign {
  return {
    id: 'cons-high',
    protocolId: 'proto-risky',
    codeHash: '0xaaa',
    agentRuns: [
      {
        agentId: 'a1',
        specialty: 'privilege',
        pathSamples: 50000,
        coverage: 0.81,
        findings: [
          {
            vectorId: 'reentrancy-line-102',
            title: 'Reentrancy',
            severity: 'critical',
            estimatedLossUsd: 2_500_000,
            reproducible: true,
          },
          {
            vectorId: 'overflow-line-47',
            title: 'Overflow',
            severity: 'high',
            estimatedLossUsd: 600_000,
            reproducible: true,
          },
        ],
      },
      {
        agentId: 'a2',
        specialty: 'arithmetic',
        pathSamples: 50000,
        coverage: 0.78,
        findings: [
          {
            vectorId: 'reentrancy-line-102',
            title: 'Reentrancy',
            severity: 'critical',
            estimatedLossUsd: 2_500_000,
            reproducible: true,
          },
          {
            vectorId: 'underflow-line-156',
            title: 'Underflow',
            severity: 'high',
            estimatedLossUsd: 420_000,
            reproducible: true,
          },
        ],
      },
      {
        agentId: 'a3',
        specialty: 'reentrancy',
        pathSamples: 50000,
        coverage: 0.8,
        findings: [
          {
            vectorId: 'reentrancy-line-102',
            title: 'Reentrancy',
            severity: 'critical',
            estimatedLossUsd: 2_500_000,
            reproducible: true,
          },
          {
            vectorId: 'overflow-line-47',
            title: 'Overflow',
            severity: 'high',
            estimatedLossUsd: 600_000,
            reproducible: true,
          },
        ],
      },
      {
        agentId: 'a4',
        specialty: 'economic',
        pathSamples: 50000,
        coverage: 0.76,
        findings: [
          {
            vectorId: 'reentrancy-line-102',
            title: 'Reentrancy',
            severity: 'critical',
            estimatedLossUsd: 2_500_000,
            reproducible: true,
          },
        ],
      },
      {
        agentId: 'a5',
        specialty: 'state',
        pathSamples: 50000,
        coverage: 0.77,
        findings: [
          {
            vectorId: 'reentrancy-line-102',
            title: 'Reentrancy',
            severity: 'critical',
            estimatedLossUsd: 2_500_000,
            reproducible: true,
          },
        ],
      },
    ],
    symbolicVerdicts: [
      { vectorId: 'reentrancy-line-102', status: 'counterexample' },
      { vectorId: 'overflow-line-47', status: 'unknown' },
      { vectorId: 'underflow-line-156', status: 'unknown' },
    ],
  };
}

describe('buildHeparConsensusSnapshot', () => {
  it('elevates high-consensus critical vectors to hard-block posture', () => {
    const snapshot = buildHeparConsensusSnapshot([makeHighRiskCampaign()]);
    const result = snapshot.results[0];

    expect(snapshot.campaignCount).toBe(1);
    expect(['deny', 'hard_block']).toContain(result.decisionBand);
    expect(result.riskScore).toBeGreaterThan(60);
    expect(result.criticalVectors).toContain('reentrancy-line-102');
    expect(result.vectors[0].vectorId).toBe('reentrancy-line-102');
    expect(result.vectors[0].consensusRate).toBe(1);
  });

  it('stays in allow posture when no vectors are found under strong coverage', () => {
    const snapshot = buildHeparConsensusSnapshot([
      {
        id: 'cons-clean',
        protocolId: 'proto-clean',
        codeHash: '0xbbb',
        agentRuns: [
          {
            agentId: 'a1',
            specialty: 'privilege',
            pathSamples: 25000,
            coverage: 0.85,
            findings: [],
          },
          {
            agentId: 'a2',
            specialty: 'arithmetic',
            pathSamples: 25000,
            coverage: 0.84,
            findings: [],
          },
        ],
      },
    ]);

    const result = snapshot.results[0];
    expect(result.decisionBand).toBe('allow');
    expect(result.riskScore).toBe(0);
    expect(result.vectors).toHaveLength(0);
    expect(result.totalSamples).toBe(50000);
  });
});
