import path from 'path';
import { buildAgentNftSnapshot, loadExampleAgentNftSnapshot, loadLocalAgentNftSnapshot } from './nfts';
import { AgentNftCollectionConfig, AgentNftDescriptor, AgentNftSnapshot } from './types';

export { buildAgentNftSnapshot, loadExampleAgentNftSnapshot, loadLocalAgentNftSnapshot };
export type { AgentNftCollectionConfig, AgentNftDescriptor, AgentNftSnapshot };

function main() {
  const snapshot = loadLocalAgentNftSnapshot(path.resolve(__dirname, '..', '..'));
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
