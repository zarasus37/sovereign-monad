import { SignalAggregateSnapshot, SignalInterpretation } from './types';

function levelFromCount(count: number, elevatedAt: number, criticalAt: number): 'stable' | 'elevated' | 'critical' {
  if (count >= criticalAt) return 'critical';
  if (count >= elevatedAt) return 'elevated';
  return 'stable';
}

export function interpretAggregate(aggregate: SignalAggregateSnapshot): SignalInterpretation[] {
  return [
    {
      label: 'coordination_pressure',
      level: levelFromCount(aggregate.byLane.fast + aggregate.bySeverity.high + aggregate.bySeverity.critical, 3, 5),
      reason: `${aggregate.byLane.fast} fast-lane and ${aggregate.bySeverity.high + aggregate.bySeverity.critical} high-severity signals are active`,
    },
    {
      label: 'boundary_tension',
      level: levelFromCount(aggregate.boundaryRelevantCount + aggregate.byDomain.integrity, 2, 4),
      reason: `${aggregate.boundaryRelevantCount} boundary-relevant and ${aggregate.byDomain.integrity} integrity-domain signals are active`,
    },
    {
      label: 'exchange_readiness',
      level: aggregate.byDomain.exchange > 0 ? 'elevated' : 'stable',
      reason: `${aggregate.byDomain.exchange} exchange-domain signals are available for outward routing`,
    },
    {
      label: 'capital_attention',
      level: levelFromCount(aggregate.capitalSensitiveCount + aggregate.byDomain.capital, 1, 3),
      reason: `${aggregate.capitalSensitiveCount} capital-sensitive and ${aggregate.byDomain.capital} capital-domain signals are active`,
    },
    {
      label: 'operator_load',
      level: levelFromCount(aggregate.bySource.operator + aggregate.byDomain.operations, 1, 3),
      reason: `${aggregate.bySource.operator} operator-sourced and ${aggregate.byDomain.operations} operations-domain signals are active`,
    },
  ];
}
