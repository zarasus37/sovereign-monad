"use strict";
// hepar-core/__tests__/structure.test.ts
// Validates module structure and exports
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
describe('hepar-core module structure', () => {
    test('orchestrator exports', () => {
        expect(index_1.HeparOrchestrator).toBeDefined();
        expect(index_1.createDefaultHeparOrchestrator).toBeDefined();
        const orchestrator = (0, index_1.createDefaultHeparOrchestrator)();
        expect(orchestrator).toBeInstanceOf(index_1.HeparOrchestrator);
    });
    test('stages export', () => {
        expect(index_1.StageA).toBeDefined();
        expect(index_1.StageB).toBeDefined();
        expect(index_1.StageC).toBeDefined();
        expect(index_1.StageD).toBeDefined();
    });
    test('agents export', () => {
        expect(index_1.HeparPrivilegeAgent).toBeDefined();
        expect(index_1.HeparArithmeticAgent).toBeDefined();
        expect(index_1.HeparReentrancyAgent).toBeDefined();
        expect(index_1.HeparEconomicAgent).toBeDefined();
        expect(index_1.HeparStateAgent).toBeDefined();
    });
    test('agent registry', () => {
        expect(index_1.createAgentRegistry).toBeDefined();
        const registry = (0, index_1.createAgentRegistry)('test-seed');
        expect(registry.size).toBe(5);
        expect(registry.has('PRIVILEGE')).toBe(true);
        expect(registry.has('ARITHMETIC')).toBe(true);
        expect(registry.has('REENTRANCY')).toBe(true);
        expect(registry.has('ECONOMIC')).toBe(true);
        expect(registry.has('STATE')).toBe(true);
    });
    test('utilities export', () => {
        expect(index_1.SeededLCG).toBeDefined();
        expect(index_1.deriveAgentSeed).toBeDefined();
        const seed = (0, index_1.deriveAgentSeed)('master', 0, 'protocol-id');
        expect(seed).toContain('master');
        expect(seed).toContain('protocol-id');
    });
    test('agent instantiation', () => {
        const agent = new index_1.HeparPrivilegeAgent('test-seed');
        expect(agent.agentId).toBe('PRIVILEGE');
        const result = agent.run();
        expect(result.agentId).toBe('PRIVILEGE');
        expect(result.findings).toBeDefined();
        expect(Array.isArray(result.findings)).toBe(true);
    });
    test('seeded rng reproducibility', () => {
        const rng1 = new index_1.SeededLCG('seed-123');
        const vals1 = [rng1.next(), rng1.next(), rng1.next()];
        const rng2 = new index_1.SeededLCG('seed-123');
        const vals2 = [rng2.next(), rng2.next(), rng2.next()];
        expect(vals1).toEqual(vals2);
    });
});
//# sourceMappingURL=structure.test.js.map