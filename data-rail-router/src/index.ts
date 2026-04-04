import path from 'path';
import { buildRoutingSnapshot, loadLocalRoutingSnapshot, routeBehaviorEvent } from './router';

export { buildRoutingSnapshot, loadLocalRoutingSnapshot, routeBehaviorEvent };
export type {
  DataRailDestination,
  DataRailPolicyInput,
  DataRailRoutingSnapshot,
  InternalDataRailDestination,
  RouteDecision,
  RoutedBehaviorEvent,
} from './types';

function main() {
  const snapshot = loadLocalRoutingSnapshot(path.resolve(__dirname, '..', '..'));
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
