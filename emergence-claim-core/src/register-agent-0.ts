import fs from 'node:fs';
import path from 'node:path';
import {
  AGENT_0_GENESIS_PROFILE,
  LIVE_REVENUE_ROUTER_ADDRESS,
  encodeAgentProfile,
  getOnchainAgentScores,
  registerAgentProfileOnchain,
  stableStringify,
} from './live-agent';

function loadEnvFile(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const idx = trimmed.indexOf('=');
    if (idx === -1) {
      continue;
    }

    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function loadKnownEnvFiles(): void {
  const repoRoot = path.resolve(__dirname, '..', '..');
  loadEnvFile(path.join(repoRoot, '.env'));
  loadEnvFile(path.resolve(repoRoot, '..', 'sovereign-monad', '.env.phase1a'));
  loadEnvFile(path.resolve(process.cwd(), '.env'));
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

async function main(): Promise<void> {
  loadKnownEnvFiles();

  const routed = encodeAgentProfile(AGENT_0_GENESIS_PROFILE);
  const prepared = {
    routed,
    onchainScores: getOnchainAgentScores(AGENT_0_GENESIS_PROFILE),
    registrationPending: process.env.AGENT_0_PREPARE_ONLY === 'true',
  };

  const reportsDir = path.resolve(process.cwd(), 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  if (process.env.AGENT_0_PREPARE_ONLY === 'true') {
    const reportPath = path.join(reportsDir, 'agent-0-registration-prepared.json');
    fs.writeFileSync(reportPath, `${stableStringify(prepared)}\n`, 'utf8');
    process.stdout.write(`${JSON.stringify({
      reportPath,
      agentId: routed.agentId,
      primaryDomain: routed.primaryDomain,
      secondaryDomain: routed.secondaryDomain,
      tertiaryDomain: routed.tertiaryDomain,
      routedToGaming: routed.routedToGaming,
      doveFlag: routed.doveMonitoringFlags.anyDoveFlag,
      onchainScores: prepared.onchainScores,
      onchainRegistered: false,
    }, null, 2)}\n`);
    return;
  }

  const rpcUrl = process.env.LIVE_AGENT_RPC_URL
    || process.env.MONAD_RPC_URL
    || process.env.PHASE1A_RPC_URL;
  if (!rpcUrl) {
    throw new Error('Set LIVE_AGENT_RPC_URL, MONAD_RPC_URL, or PHASE1A_RPC_URL.');
  }

  const privateKey = process.env.LIVE_AGENT_PRIVATE_KEY
    || process.env.DEPLOYER_PRIVATE_KEY
    || process.env.WALLET_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('Set LIVE_AGENT_PRIVATE_KEY, DEPLOYER_PRIVATE_KEY, or WALLET_PRIVATE_KEY.');
  }

  const onchain = await registerAgentProfileOnchain(routed, {
    rpcUrl,
    privateKey,
    emergenceRecorderAddress: requireEnv('EMERGENCE_RECORDER_ADDRESS'),
    revenueRouterAddress: process.env.REVENUE_ROUTER_ADDRESS || LIVE_REVENUE_ROUTER_ADDRESS,
  });

  const report = {
    ...prepared,
    onchain,
  };
  const reportPath = path.join(reportsDir, 'agent-0-registration-proof.json');
  fs.writeFileSync(reportPath, `${stableStringify(report)}\n`, 'utf8');

  process.stdout.write(`${JSON.stringify({
    reportPath,
    agentId: routed.agentId,
    primaryDomain: routed.primaryDomain,
    secondaryDomain: routed.secondaryDomain,
    tertiaryDomain: routed.tertiaryDomain,
    doveFlag: routed.doveMonitoringFlags.anyDoveFlag,
    txHash: onchain.txHash,
    explorerUrl: onchain.explorerUrl,
  }, null, 2)}\n`);
}

if (require.main === module) {
  main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  });
}
