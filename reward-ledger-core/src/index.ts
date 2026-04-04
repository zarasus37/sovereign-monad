import path from 'path';
import { buildLedgerEntry, buildRewardLedgerSnapshot, loadLocalRewardLedgerSnapshot } from './ledger';

export { buildLedgerEntry, buildRewardLedgerSnapshot, loadLocalRewardLedgerSnapshot };
export type { ActorLedgerBalance, LedgerEntry, RewardLedgerInput, RewardLedgerSnapshot } from './types';

function main() {
  const snapshot = loadLocalRewardLedgerSnapshot(path.resolve(__dirname, '..', '..'));
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
