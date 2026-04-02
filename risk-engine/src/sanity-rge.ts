import { RiskGnosisEngine } from './core/rge';

const engine = new RiskGnosisEngine(10_000, 0.30);

console.log('Effective bps (42bps, 4s):', engine.effectiveSpread(42, 4));
console.log('Position size (42bps, 4s):', engine.positionSize(42, 4));
