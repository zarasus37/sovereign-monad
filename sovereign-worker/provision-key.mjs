#!/usr/bin/env node
/**
 * Sovereign API Key Provisioner
 * Usage: node provision-key.mjs <clientName> <email> <tier> [aumCapOverride]
 *
 * Tiers: starter | pro | fund | enterprise
 *
 * Examples:
 *   node provision-key.mjs "Alpha Capital" "alex@alphacap.xyz" pro
 *   node provision-key.mjs "Mega Fund" "cio@megafund.io" fund
 *
 * Requires wrangler to be installed and authenticated:
 *   npm install -g wrangler
 *   wrangler login
 */

import { execSync } from 'child_process';
import { randomBytes } from 'crypto';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const KV_NAMESPACE_ID = '3db6365424c64247b41bf6d31cc3c590';

const TIERS = {
  starter:    { dailyLimit: 1_000,  aumCapUsd: 5_000_000 },
  pro:        { dailyLimit: 10_000, aumCapUsd: 25_000_000 },
  fund:       { dailyLimit: null,   aumCapUsd: 100_000_000 },
  enterprise: { dailyLimit: null,   aumCapUsd: null },
};

const [, , clientName, email, tier] = process.argv;

if (!clientName || !email || !tier) {
  console.error('Usage: node provision-key.mjs "<clientName>" "<email>" <tier>');
  console.error('Tiers: starter | pro | fund | enterprise');
  process.exit(1);
}

if (!TIERS[tier]) {
  console.error(`Unknown tier: ${tier}. Valid tiers: ${Object.keys(TIERS).join(', ')}`);
  process.exit(1);
}

// Generate API key: sk-sovereign-<32 hex chars>
const apiKey = `sk-sovereign-${randomBytes(16).toString('hex')}`;

const record = {
  clientName,
  email,
  tier,
  createdAt: new Date().toISOString().slice(0, 10),
  aumCapUsd: TIERS[tier].aumCapUsd,
  dailyCallLimit: TIERS[tier].dailyLimit,
};

const value = JSON.stringify(record);

console.log('\n── Provisioning API Key ─────────────────────────────────────────');
console.log(`  Client:    ${clientName}`);
console.log(`  Email:     ${email}`);
console.log(`  Tier:      ${tier}`);
console.log(`  AUM Cap:   ${TIERS[tier].aumCapUsd !== null ? `$${TIERS[tier].aumCapUsd.toLocaleString()}` : 'Unlimited'}`);
console.log(`  Daily Limit: ${TIERS[tier].dailyLimit !== null ? TIERS[tier].dailyLimit.toLocaleString() + ' calls' : 'Unlimited'}`);
console.log(`  API Key:   ${apiKey}`);
console.log('─────────────────────────────────────────────────────────────────\n');

const tmpFile = join(tmpdir(), `sovereign-key-${Date.now()}.json`);

try {
  writeFileSync(tmpFile, value, 'utf8');

  execSync(
    `wrangler kv key put --namespace-id ${KV_NAMESPACE_ID} "${apiKey}" --path "${tmpFile}" --remote`,
    { stdio: 'inherit', cwd: process.env.USERPROFILE || process.env.HOME }
  );

  console.log('\n✓ Key provisioned to KV.');
  console.log('\nSend this to the client:\n');
  console.log(`  API Key:    ${apiKey}`);
  console.log(`  Endpoint:   https://sovereign-rge-api.sovereign-mev.workers.dev`);
  console.log(`  Tier:       ${tier}`);
  console.log(`  Daily limit: ${TIERS[tier].dailyLimit !== null ? TIERS[tier].dailyLimit.toLocaleString() : 'Unlimited'} calls\n`);
} catch (err) {
  console.error('\n✗ Failed to write to KV. Is wrangler authenticated?');
  console.error('  Run: wrangler login');
  process.exit(1);
} finally {
  try { unlinkSync(tmpFile); } catch {}
}
