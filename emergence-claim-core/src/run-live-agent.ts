import fs from 'node:fs';
import path from 'node:path';
import { JsonRpcProvider } from 'ethers';
import {
  DEFAULT_MONAD_MARKET_ID,
  FIRST_ECOSYSTEM_AGENT_PROFILE,
  LIVE_REVENUE_ROUTER_ADDRESS,
  executeAgentDecision,
  runLiveAgentProof,
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
  loadEnvFile(path.join(repoRoot, '.env.testnet'));
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

  const rpcUrl = process.env.LIVE_AGENT_RPC_URL
    || process.env.MONAD_RPC_URL
    || process.env.PHASE1A_RPC_URL;
  if (!rpcUrl) {
    throw new Error('Set LIVE_AGENT_RPC_URL, MONAD_RPC_URL, or PHASE1A_RPC_URL.');
  }

  if (process.env.LIVE_AGENT_PREPARE_ONLY === 'true') {
    const provider = new JsonRpcProvider(rpcUrl);
    const prepared = await executeAgentDecision(
      FIRST_ECOSYSTEM_AGENT_PROFILE,
      provider,
      {
        revenueRouterAddress: process.env.REVENUE_ROUTER_ADDRESS || LIVE_REVENUE_ROUTER_ADDRESS,
        marketAddress: process.env.LIVE_AGENT_MARKET_ADDRESS || process.env.KURU_MON_USDC_ADDR,
        marketId: process.env.LIVE_AGENT_MARKET_ID || DEFAULT_MONAD_MARKET_ID,
      },
    );
    const reportsDir = path.resolve(process.cwd(), 'reports');
    fs.mkdirSync(reportsDir, { recursive: true });
    const reportPath = path.join(reportsDir, 'live-agent-prepared-decision.json');
    fs.writeFileSync(reportPath, `${stableStringify(prepared)}\n`, 'utf8');
    process.stdout.write(`${JSON.stringify({
      reportPath,
      agentId: prepared.routed.agentId,
      domain: prepared.routed.domain,
      action: prepared.decision.action,
      decisionHash: prepared.decision.decisionHash,
      onchainRecorded: false,
    }, null, 2)}\n`);
    return;
  }

  const privateKey = process.env.LIVE_AGENT_PRIVATE_KEY
    || process.env.DEPLOYER_PRIVATE_KEY
    || process.env.WALLET_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('Set LIVE_AGENT_PRIVATE_KEY, DEPLOYER_PRIVATE_KEY, or WALLET_PRIVATE_KEY.');
  }

  const proof = await runLiveAgentProof({
    rpcUrl,
    privateKey,
    emergenceRecorderAddress: requireEnv('EMERGENCE_RECORDER_ADDRESS'),
    revenueRouterAddress: process.env.REVENUE_ROUTER_ADDRESS || LIVE_REVENUE_ROUTER_ADDRESS,
    marketAddress: process.env.LIVE_AGENT_MARKET_ADDRESS || process.env.KURU_MON_USDC_ADDR,
    marketId: process.env.LIVE_AGENT_MARKET_ID || DEFAULT_MONAD_MARKET_ID,
  });

  const reportsDir = path.resolve(process.cwd(), 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });
  const reportPath = path.join(reportsDir, 'live-agent-proof.json');
  fs.writeFileSync(reportPath, `${stableStringify(proof)}\n`, 'utf8');

  process.stdout.write(`${JSON.stringify({
    reportPath,
    agentId: proof.routedProfile.agentId,
    domain: proof.routedProfile.domain,
    action: proof.decision.action,
    decisionHash: proof.decision.decisionHash,
    recorder: proof.onchain.recorderAddress,
    txHash: proof.onchain.txHash,
    explorerUrl: proof.onchain.explorerUrl,
  }, null, 2)}\n`);
}

if (require.main === module) {
  main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  });
}
