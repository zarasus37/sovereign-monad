import { OrganRuntime } from './runtime';

export { ORGAN_DEFINITIONS } from './organs';
export { buildRuntimeSnapshot } from './coordinator';
export { buildCortexSnapshot, synthesizeBrief } from './cortex';
export { buildHeparSnapshot, screenOpportunity } from './hepar';
export { buildSynapseSnapshot, routeSignal } from './synapse';
export { OrganRuntime } from './runtime';
export { buildVoxSnapshot, packageNarrative } from './vox';
export type {
  CortexAudience,
  CortexBrief,
  CortexResearchItem,
  CortexRuntimeSnapshot,
  HeparDecision,
  HeparOpportunity,
  HeparRuntimeSnapshot,
  OrganDefinition,
  OrganName,
  OrganRuntimeConfig,
  OrganRuntimeSnapshot,
  OrganSnapshot,
  RuntimeMode,
  SynapseRouteDecision,
  SynapseRuntimeSnapshot,
  SynapseSignal,
  SynapseSignalCategory,
  SynapseSignalSeverity,
  SynapseLatencyClass,
  VoxAudience,
  VoxFormat,
  VoxNarrativePackage,
  VoxNarrativeRequest,
  VoxRuntimeSnapshot,
} from './types';

function main() {
  const runtime = new OrganRuntime();
  const snapshot = runtime.run();
  process.stdout.write(`${JSON.stringify(snapshot, null, 2)}\n`);
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(message);
    process.exitCode = 1;
  }
}
