import { shouldApproveEvaluation } from '../src/approval';

describe('shouldApproveEvaluation', () => {
  const relaxedConfig = {
    evMinThreshold: 0,
    sharpeLikeThreshold: -100,
    maxTailLossPercent: 100,
  };

  it('rejects negative EV even with relaxed thresholds', () => {
    expect(
      shouldApproveEvaluation(
        {
          signal: {
            direction: 'buy_M_sell_E',
            rawSpreadBps: 5,
            effectiveSpreadBps: 2,
            kellySizeUsd: 100,
            timestamp: Date.now(),
            confidence: 0.65,
          },
          notional: 100,
          evMean: -0.01,
          sharpeLike: 50,
          maxDrawdownEstimate: -1,
        },
        relaxedConfig
      )
    ).toBe(false);
  });

  it('approves only when EV and risk thresholds are satisfied', () => {
    expect(
      shouldApproveEvaluation(
        {
          signal: {
            direction: 'buy_M_sell_E',
            rawSpreadBps: 25,
            effectiveSpreadBps: 15,
            kellySizeUsd: 250,
            timestamp: Date.now(),
            confidence: 0.65,
          },
          notional: 250,
          evMean: 25,
          sharpeLike: 1.2,
          maxDrawdownEstimate: -20,
        },
        {
          evMinThreshold: 10,
          sharpeLikeThreshold: 0.3,
          maxTailLossPercent: 20,
        }
      )
    ).toBe(true);
  });
});