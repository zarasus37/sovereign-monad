// hepar-core/__tests__/structure.test.ts
// Validates module structure and exports

import {
  HeparOrchestrator,
  createDefaultHeparOrchestrator,
  StageA,
  StageB,
  StageC,
  StageD,
  createAgentRegistry,
  HeparPrivilegeAgent,
  HeparArithmeticAgent,
  HeparReentrancyAgent,
  HeparEconomicAgent,
  HeparStateAgent,
  SeededLCG,
  deriveAgentSeed,
} from '../index';

describe('hepar-core module structure', () => {
  test('orchestrator exports', () => {
    expect(HeparOrchestrator).toBeDefined();
    expect(createDefaultHeparOrchestrator).toBeDefined();

    const orchestrator = createDefaultHeparOrchestrator();
    expect(orchestrator).toBeInstanceOf(HeparOrchestrator);
  });

  test('stages export', () => {
    expect(StageA).toBeDefined();
    expect(StageB).toBeDefined();
    expect(StageC).toBeDefined();
    expect(StageD).toBeDefined();
  });

  test('agents export', () => {
    expect(HeparPrivilegeAgent).toBeDefined();
    expect(HeparArithmeticAgent).toBeDefined();
    expect(HeparReentrancyAgent).toBeDefined();
    expect(HeparEconomicAgent).toBeDefined();
    expect(HeparStateAgent).toBeDefined();
  });

  test('agent registry', () => {
    expect(createAgentRegistry).toBeDefined();
    const registry = createAgentRegistry('test-seed');
    expect(registry.size).toBe(5);
    expect(registry.has('PRIVILEGE')).toBe(true);
    expect(registry.has('ARITHMETIC')).toBe(true);
    expect(registry.has('REENTRANCY')).toBe(true);
    expect(registry.has('ECONOMIC')).toBe(true);
    expect(registry.has('STATE')).toBe(true);
  });

  test('utilities export', () => {
    expect(SeededLCG).toBeDefined();
    expect(deriveAgentSeed).toBeDefined();

    const seed = deriveAgentSeed('master', 0, 'protocol-id');
    expect(seed).toContain('master');
    expect(seed).toContain('protocol-id');
  });

  test('agent instantiation', () => {
    const agent = new HeparPrivilegeAgent('test-seed');
    expect(agent.agentId).toBe('PRIVILEGE');

    const result = agent.run();
    expect(result.agentId).toBe('PRIVILEGE');
    expect(result.findings).toBeDefined();
    expect(Array.isArray(result.findings)).toBe(true);
  });

  test('seeded rng reproducibility', () => {
    const rng1 = new SeededLCG('seed-123');
    const vals1 = [rng1.next(), rng1.next(), rng1.next()];

    const rng2 = new SeededLCG('seed-123');
    const vals2 = [rng2.next(), rng2.next(), rng2.next()];

    expect(vals1).toEqual(vals2);
  });
});
