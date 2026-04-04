import { OrganRuntime } from './runtime';

export { ORGAN_DEFINITIONS } from './organs';
export { buildRuntimeSnapshot } from './coordinator';
export { OrganRuntime } from './runtime';
export type {
  OrganDefinition,
  OrganName,
  OrganRuntimeConfig,
  OrganRuntimeSnapshot,
  OrganSnapshot,
  RuntimeMode,
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
