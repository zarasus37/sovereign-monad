import path from 'path';
import requestExample from '../config/request.example.json';
import { deriveExpansionCapabilities, evaluateExpansionRequest, loadLocalExpansionDecision } from './evaluator';
import { ExpansionRequest } from './types';

export { deriveExpansionCapabilities, evaluateExpansionRequest, loadLocalExpansionDecision };
export type {
  ExpansionCapability,
  ExpansionDecision,
  ExpansionPolicy,
  ExpansionRequest,
  ExpansionSummaryInput,
} from './types';

function main() {
  const decision = loadLocalExpansionDecision(
    path.resolve(__dirname, '..', '..'),
    requestExample as ExpansionRequest,
  );
  process.stdout.write(`${JSON.stringify(decision, null, 2)}\n`);
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
