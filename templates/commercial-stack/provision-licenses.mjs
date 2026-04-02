#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const defaultSeedPath = path.resolve(scriptDir, 'license-seeds.json');
const defaultStorePath = path.resolve(rootDir, 'license-service', 'config', 'licenses.json');

function usage() {
  console.error(
    [
      'Usage:',
      '  node provision-licenses.mjs [seed-file] [store-file]',
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

function generateLicenseKey(tier) {
  const prefix = tier === 'enterprise' ? 'SMEV-ENT' : 'SMEV-FUND';
  return `${prefix}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function findExisting(records, seed) {
  if (seed.licenseKey) {
    return records.find((record) => record.licenseKey === seed.licenseKey) ?? null;
  }

  return (
    records.find(
      (record) => record.customer === seed.customer && record.tier === seed.tier
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

if (!Array.isArray(seeds) || !Array.isArray(records)) {
  console.error('Seed file and store file must each contain a JSON array.');
  process.exit(1);
}

const summary = {
  created: [],
  updated: [],
};

for (const seed of seeds) {
  if (!seed.customer || !seed.tier) {
    console.error('Each license seed requires customer and tier.');
    process.exit(1);
  }

  if (seed.tier !== 'fund' && seed.tier !== 'enterprise') {
    console.error(`Unsupported license tier: ${seed.tier}`);
    process.exit(1);
  }

  const existing = findExisting(records, seed);

  if (existing) {
    existing.customer = seed.customer;
    existing.tier = seed.tier;
    existing.status = seed.status || 'active';
    existing.maxActivations = seed.maxActivations ?? existing.maxActivations ?? 1;
    existing.notes = seed.notes ?? existing.notes;
    existing.createdAt = existing.createdAt || seed.createdAt || new Date().toISOString();
    if (seed.licenseKey) {
      existing.licenseKey = seed.licenseKey;
    }
    if (seed.resetActivations) {
      existing.activations = [];
    }
    summary.updated.push({
      customer: existing.customer,
      tier: existing.tier,
      licenseKey: existing.licenseKey,
    });
    continue;
  }

  const created = {
    licenseKey: seed.licenseKey || generateLicenseKey(seed.tier),
    customer: seed.customer,
    tier: seed.tier,
    status: seed.status || 'active',
    maxActivations: seed.maxActivations ?? 1,
    activations: [],
    createdAt: seed.createdAt || new Date().toISOString(),
    notes: seed.notes,
  };

  records.push(created);
  summary.created.push({
    customer: created.customer,
    tier: created.tier,
    licenseKey: created.licenseKey,
  });
}

writeJson(storePath, records);
console.log(JSON.stringify(summary, null, 2));
