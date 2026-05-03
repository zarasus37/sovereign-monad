import { OrganName, OrchestrationPhase, OrchestrationRuntimeSnapshot } from './types';

const PHASES: OrchestrationPhase[] = [
  { name: 'signal_route', owner: 'Synapse' },
  { name: 'opportunity_filter', owner: 'Hepar', dependsOn: ['signal_route'] },
  { name: 'research_synthesis', owner: 'Cortex', dependsOn: ['signal_route', 'opportunity_filter'] },
  { name: 'capital_gate', owner: 'Cardia', dependsOn: ['opportunity_filter', 'research_synthesis'] },
  { name: 'narrative_package', owner: 'Vox', dependsOn: ['research_synthesis'] },
  { name: 'external_exchange', owner: 'Pneuma', dependsOn: ['narrative_package'] },
];

export function buildOrchestrationSnapshot(
  implementedOrgans: OrganName[],
): OrchestrationRuntimeSnapshot {
  const missing = PHASES.filter((phase) => !implementedOrgans.includes(phase.owner)).map(
    (phase) => `${phase.owner} missing for ${phase.name}`,
  );

  const bottlenecks = [...missing];
  if (!implementedOrgans.includes('Cardia')) {
    bottlenecks.push('capital gate remains analysis-only until Cardia is fully available');
  }

  return {
    implemented: true,
    phases: PHASES,
    bottlenecks,
  };
}
