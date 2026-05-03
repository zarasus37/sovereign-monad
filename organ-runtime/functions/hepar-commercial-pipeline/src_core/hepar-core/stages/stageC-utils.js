"use strict";
// hepar-core/stages/stageC-utils.ts
// Shared utilities and types for Stage C Monte Carlo.
// NO imports from stageC-montecarlo or any agent file -- avoids circular deps.
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeededLCG = exports.deriveAgentSeed = exports.hashToNumber = void 0;
function hashToNumber(s) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) {
        h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
    }
    return h >>> 0;
}
exports.hashToNumber = hashToNumber;
function deriveAgentSeed(masterSeed, agentIndex, protocolId) {
    return `${masterSeed}:agent${agentIndex}:${protocolId}`;
}
exports.deriveAgentSeed = deriveAgentSeed;
class SeededLCG {
    constructor(seedStr) {
        this.state = hashToNumber(seedStr);
    }
    next() {
        const a = 1664525;
        const c = 1013904223;
        const lo = (this.state & 0xffff) * a;
        const hi = ((this.state >>> 16) * a) & 0xffff;
        this.state = ((lo + (hi << 16)) + c) >>> 0;
        return this.state;
    }
    nextInt(min, max) {
        const range = max - min + 1;
        return min + (this.next() % range);
    }
    nextFloat(min, max) {
        const t = this.next() / 0x100000000;
        return min + t * (max - min);
    }
    pickN(arr, n) {
        const copy = arr.slice();
        const len = copy.length;
        const safeN = Math.min(n, len);
        for (let i = len - 1; i > 0; i--) {
            const j = this.next() % (i + 1);
            const tmp = copy[i];
            copy[i] = copy[j];
            copy[j] = tmp;
        }
        return copy.slice(0, safeN);
    }
}
exports.SeededLCG = SeededLCG;
//# sourceMappingURL=stageC-utils.js.map