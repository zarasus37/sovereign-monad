import { buildKeyLayerSnapshot, evaluateKeyRequest, loadExampleRequests } from './evaluator';

export { buildKeyLayerSnapshot, evaluateKeyRequest, loadExampleRequests };
export type { KeyActivationClass, KeyActivationRequest, KeyDecision, KeyLayerSnapshot, KeyScope } from './types';

function main() {
  const snapshot = buildKeyLayerSnapshot(loadExampleRequests());
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
