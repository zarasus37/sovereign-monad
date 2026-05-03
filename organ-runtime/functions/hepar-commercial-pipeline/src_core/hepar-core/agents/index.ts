// hepar-core/agents/index.ts
// Agent factory and coordinator for Stage C

import type { AgentExecutor, AgentId } from '../stages/stageC-utils';
import { HeparPrivilegeAgent } from './HeparPrivilegeAgent';
import { HeparArithmeticAgent } from './HeparArithmeticAgent';
import { HeparReentrancyAgent } from './HeparReentrancyAgent';
import { HeparEconomicAgent } from './HeparEconomicAgent';
import { HeparStateAgent } from './HeparStateAgent';

/**
 * Creates an agent executor that wraps STUB or LIVE implementations
 */
export function createAgentExecutor(agentId: AgentId, seed: string, mode: 'STUB' | 'LIVE' = 'STUB'): AgentExecutor {
  return {
    agentId,
    run: (agentSeed: string) => {
      switch (agentId) {
        case 'PRIVILEGE':
          return new HeparPrivilegeAgent(agentSeed).run();
        case 'ARITHMETIC':
          return new HeparArithmeticAgent(agentSeed).run();
        case 'REENTRANCY':
          return new HeparReentrancyAgent(agentSeed).run();
        case 'ECONOMIC':
          return new HeparEconomicAgent(agentSeed).run();
        case 'STATE':
          return new HeparStateAgent(agentSeed).run();
        default:
          throw new Error(`Unknown agent: ${agentId}`);
      }
    },
  };
}

/**
 * Create all standard agents as a registry
 */
export function createAgentRegistry(seed: string, mode: 'STUB' | 'LIVE' = 'STUB'): Map<AgentId, AgentExecutor> {
  const agents = new Map<AgentId, AgentExecutor>();
  const agentIds: AgentId[] = ['PRIVILEGE', 'ARITHMETIC', 'REENTRANCY', 'ECONOMIC', 'STATE'];

  for (const agentId of agentIds) {
    agents.set(agentId, createAgentExecutor(agentId, seed, mode));
  }

  return agents;
}

export { HeparPrivilegeAgent, HeparArithmeticAgent, HeparReentrancyAgent, HeparEconomicAgent, HeparStateAgent };
