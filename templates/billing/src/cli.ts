import dotenv from 'dotenv';
import { ClientStore } from './client-store';
import { ApiTier, getBillingConfig } from './config';

dotenv.config();

function usage(): never {
  console.error(
    [
      'Usage:',
      '  ts-node src/cli.ts issue-manual-key "Client Name" starter client@example.com "USDC tx 0x..."',
      '  ts-node src/cli.ts deactivate-subscription sub_123',
    ].join('\n')
  );
  process.exit(1);
}

const [, , command, arg1, arg2, arg3, arg4] = process.argv;
const store = new ClientStore(getBillingConfig().apiKeyStorePath);

if (!command) {
  usage();
}

if (command === 'issue-manual-key') {
  if (!arg1 || !arg2) {
    usage();
  }

  const client = store.issueManualClient({
    clientName: arg1,
    tier: arg2 as ApiTier,
    email: arg3,
    notes: arg4 || 'Manual issuance after USDC settlement',
  });

  console.log(JSON.stringify(client, null, 2));
  process.exit(0);
}

if (command === 'deactivate-subscription') {
  if (!arg1) {
    usage();
  }

  const client = store.deactivateBySubscriptionId(arg1);
  console.log(JSON.stringify(client, null, 2));
  process.exit(0);
}

usage();
