import { RiskGnosisEngine } from '../src/core/rge';

describe('RiskGnosisEngine core behavior', () => {
  const portfolio = 10_000;
  const annualVol = 0.30;
  const engine = new RiskGnosisEngine(portfolio, annualVol);

  test('42bps, 4s -> ~20-30bps effective', () => {
    const eff = engine.effectiveSpread(42, 4);
    expect(eff).toBeGreaterThan(20);
    expect(eff).toBeLessThan(30);
  });

  test('42bps, 4s -> hits 10% cap (~$1,000)', () => {
    const size = engine.positionSize(42, 4);
    expect(size).toBeGreaterThanOrEqual(900);
    expect(size).toBeLessThanOrEqual(1000);
  });

  test('thin edge 10bps, 4s -> rejected', () => {
    const size = engine.positionSize(10, 4);
    expect(size).toBe(0);
  });

  test('big edge 200bps, 4s -> hits 10% cap', () => {
    const size = engine.positionSize(200, 4);
    expect(size).toBeGreaterThanOrEqual(900);
    expect(size).toBeLessThanOrEqual(1000);
  });

  test('long delay kills small edge', () => {
    const eff = engine.effectiveSpread(42, 300);
    const size = engine.positionSize(42, 300);
    expect(eff).toBeLessThan(25.93);
    expect(size).toBe(0);
  });
});