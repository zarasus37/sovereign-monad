import path from 'path';
import { buildDaoSnapshot, loadExampleDaoSnapshot, loadLocalDaoSnapshot } from './dao';
import { DaoConstitution, DaoProposal, DaoProposalDecision, DaoSnapshot } from './types';

export { buildDaoSnapshot, loadExampleDaoSnapshot, loadLocalDaoSnapshot };
export type { DaoConstitution, DaoProposal, DaoProposalDecision, DaoSnapshot };

function main() {
  const snapshot = loadLocalDaoSnapshot(path.resolve(__dirname, '..', '..'));
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
