#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const defaultSeedPath = path.resolve(scriptDir, 'customer-seeds.json');
const defaultStorePath = path.resolve(rootDir, 'api', 'config', 'api-keys.json');

const tierDefaults = {
  starter: { aumCapUsd: 5_000_000, dailyCallLimit: 1000 },
  pro: { aumCapUsd: 25_000_000, dailyCallLimit: 10000 },
  fund: { aumCapUsd: 100_000_000, dailyCallLimit: null },
  enterprise: { aumCapUsd: 999_999_999_999, dailyCallLimit: null },
};

function usage() {
  console.error(
    [
      'Usage:',
      '  node provision-api-clients.mjs [seed-file] [store-file]',
      '',
      'Defaults:',
      `  seed-file: ${defaultSeedPath}`,
      `  store-file: ${defaultStorePath}`,
    ].join('\n')
  );
  process.exit(1);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function generateApiKey() {
  return `smev_${crypto.randomBytes(24).toString('hex')}`;
}

function findExisting(records, seed) {
  if (seed.key) {
    return records.find((record) => record.key === seed.key) ?? null;
  }

  if (seed.email) {
    return (
      records.find(
        (record) =>
          record.email &&
          record.email.toLowerCase() === seed.email.toLowerCase() &&
          record.tier === seed.tier
      ) ?? null
    );
  }

  return (
    records.find(
      (record) => record.clientName === seed.clientName && record.tier === seed.tier
    ) ?? null
  );
}

const [, , seedArg, storeArg] = process.argv;

if (seedArg === '--help' || seedArg === '-h') {
  usage();
}

const seedPath = path.resolve(seedArg || defaultSeedPath);
const storePath = path.resolve(storeArg || defaultStorePath);

if (!fs.existsSync(seedPath)) {
  console.error(`Missing seed file: ${seedPath}`);
  process.exit(1);
}

if (!fs.existsSync(storePath)) {
  console.error(`Missing store file: ${storePath}`);
  process.exit(1);
}

const seeds = readJson(seedPath);
const records = readJson(storePath);

if (!Array.isArray(seeds)) {
  console.error('Seed file must contain a JSON array.');
  process.exit(1);
}

if (!Array.isArray(records)) {
  console.error('Store file must contain a JSON array.');
  process.exit(1);
}

const summary = {
  created: [],
  updated: [],
};

for (const seed of seeds) {
  if (!seed.clientName || !seed.tier) {
    console.error('Each customer seed requires clientName and tier.');
    process.exit(1);
  }

  if (!tierDefaults[seed.tier]) {
    console.error(`Unsupported tier: ${seed.tier}`);
    process.exit(1);
  }

  const existing = findExisting(records, seed);
  const defaults = tierDefaults[seed.tier];

  if (existing) {
    existing.clientName = seed.clientName;
    existing.tier = seed.tier;
    existing.aumCapUsd = seed.aumCapUsd ?? defaults.aumCapUsd;
    existing.dailyCallLimit =
      Object.prototype.hasOwnProperty.call(seed, 'dailyCallLimit')
        ? seed.dailyCallLimit
        : defaults.dailyCallLimit;
    existing.email = seed.email ?? existing.email;
    existing.notes = seed.notes ?? existing.notes;
    existing.active = seed.active ?? true;
    if (seed.key) {
      existing.key = seed.key;
    }
    if (!existing.createdAt) {
      existing.createdAt = new Date().toISOString();
    }
    if (!existing.active && !existing.deactivatedAt) {
      existing.deactivatedAt = new Date().toISOString();
    }
    if (existing.active && existing.deactivatedAt) {
      delete existing.deactivatedAt;
    }
    summary.updated.push({
      clientName: existing.clientName,
      tier: existing.tier,
      key: existing.key,
    });
    continue;
  }

  const created = {
    key: seed.key || generateApiKey(),
    clientName: seed.clientName,
    tier: seed.tier,
    aumCapUsd: seed.aumCapUsd ?? defaults.aumCapUsd,
    dailyCallLimit:
      Object.prototype.hasOwnProperty.call(seed, 'dailyCallLimit')
        ? seed.dailyCallLimit
        : defaults.dailyCallLimit,
    createdAt: seed.createdAt || new Date().toISOString(),
    active: seed.active ?? true,
    email: seed.email,
    notes: seed.notes,
  };

  records.push(created);
  summary.created.push({
    clientName: created.clientName,
    tier: created.tier,
    key: created.key,
  });
}

writeJson(storePath, records);
console.log(JSON.stringify(summary, null, 2));
