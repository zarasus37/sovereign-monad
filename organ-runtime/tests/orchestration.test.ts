import { buildOrchestrationSnapshot } from '../src/orchestration';

describe('buildOrchestrationSnapshot', () => {
  it('reports no bottlenecks when all organ phases are implemented', () => {
    const snapshot = buildOrchestrationSnapshot([
      'Synapse',
      'Hepar',
      'Cortex',
      'Cardia',
      'Vox',
      'Pneuma',
    ]);

    expect(snapshot.phases).toHaveLength(6);
    expect(snapshot.bottlenecks).toEqual([]);
  });

  it('surfaces missing-organ bottlenecks when orchestration is incomplete', () => {
    const snapshot = buildOrchestrationSnapshot(['Synapse', 'Hepar', 'Cortex', 'Vox', 'Pneuma']);

    expect(snapshot.bottlenecks).toContain('Cardia missing for capital_gate');
    expect(snapshot.bottlenecks).toContain(
      'capital gate remains analysis-only until Cardia is fully available',
    );
  });
});
