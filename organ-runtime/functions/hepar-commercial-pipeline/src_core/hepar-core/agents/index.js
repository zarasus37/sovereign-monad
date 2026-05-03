"use strict";
// hepar-core/agents/index.ts
// Agent factory and coordinator for Stage C
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeparStateAgent = exports.HeparEconomicAgent = exports.HeparReentrancyAgent = exports.HeparArithmeticAgent = exports.HeparPrivilegeAgent = exports.createAgentRegistry = exports.createAgentExecutor = void 0;
const HeparPrivilegeAgent_1 = require("./HeparPrivilegeAgent");
Object.defineProperty(exports, "HeparPrivilegeAgent", { enumerable: true, get: function () { return HeparPrivilegeAgent_1.HeparPrivilegeAgent; } });
const HeparArithmeticAgent_1 = require("./HeparArithmeticAgent");
Object.defineProperty(exports, "HeparArithmeticAgent", { enumerable: true, get: function () { return HeparArithmeticAgent_1.HeparArithmeticAgent; } });
const HeparReentrancyAgent_1 = require("./HeparReentrancyAgent");
Object.defineProperty(exports, "HeparReentrancyAgent", { enumerable: true, get: function () { return HeparReentrancyAgent_1.HeparReentrancyAgent; } });
const HeparEconomicAgent_1 = require("./HeparEconomicAgent");
Object.defineProperty(exports, "HeparEconomicAgent", { enumerable: true, get: function () { return HeparEconomicAgent_1.HeparEconomicAgent; } });
const HeparStateAgent_1 = require("./HeparStateAgent");
Object.defineProperty(exports, "HeparStateAgent", { enumerable: true, get: function () { return HeparStateAgent_1.HeparStateAgent; } });
/**
 * Creates an agent executor that wraps STUB or LIVE implementations
 */
function createAgentExecutor(agentId, seed, mode = 'STUB') {
    return {
        agentId,
        run: (agentSeed) => {
            switch (agentId) {
                case 'PRIVILEGE':
                    return new HeparPrivilegeAgent_1.HeparPrivilegeAgent(agentSeed).run();
                case 'ARITHMETIC':
                    return new HeparArithmeticAgent_1.HeparArithmeticAgent(agentSeed).run();
                case 'REENTRANCY':
                    return new HeparReentrancyAgent_1.HeparReentrancyAgent(agentSeed).run();
                case 'ECONOMIC':
                    return new HeparEconomicAgent_1.HeparEconomicAgent(agentSeed).run();
                case 'STATE':
                    return new HeparStateAgent_1.HeparStateAgent(agentSeed).run();
                default:
                    throw new Error(`Unknown agent: ${agentId}`);
            }
        },
    };
}
exports.createAgentExecutor = createAgentExecutor;
/**
 * Create all standard agents as a registry
 */
function createAgentRegistry(seed, mode = 'STUB') {
    const agents = new Map();
    const agentIds = ['PRIVILEGE', 'ARITHMETIC', 'REENTRANCY', 'ECONOMIC', 'STATE'];
    for (const agentId of agentIds) {
        agents.set(agentId, createAgentExecutor(agentId, seed, mode));
    }
    return agents;
}
exports.createAgentRegistry = createAgentRegistry;
//# sourceMappingURL=index.js.map