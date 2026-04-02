import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

type LicenseTier = 'fund' | 'enterprise';
type LicenseStatus = 'active' | 'revoked';

interface ActivationRecord {
  activationId: string;
  machineId: string;
  activatedAt: string;
}

interface LicenseRecord {
  licenseKey: string;
  customer: string;
  tier: LicenseTier;
  status: LicenseStatus;
  maxActivations: number;
  activations: ActivationRecord[];
  createdAt?: string;
  notes?: string;
}

const app = express();
app.use(express.json());

const port = parseInt(process.env.PORT || '4010', 10);
const storePath =
  process.env.LICENSE_STORE_PATH || path.resolve(__dirname, '../config/licenses.json');

function readStore(): LicenseRecord[] {
  return JSON.parse(fs.readFileSync(storePath, 'utf8')) as LicenseRecord[];
}

function writeStore(records: LicenseRecord[]): void {
  fs.writeFileSync(storePath, JSON.stringify(records, null, 2) + '\n', 'utf8');
}

function findRecord(records: LicenseRecord[], licenseKey: string): LicenseRecord | undefined {
  return records.find((record) => record.licenseKey === licenseKey);
}

function envResponse(record: LicenseRecord, activation: ActivationRecord) {
  return [
    `LICENSE_KEY=${record.licenseKey}`,
    'LICENSE_ACTIVATED=true',
    `LICENSE_ACTIVATED_AT=${activation.activatedAt}`,
    `LICENSE_ACTIVATION_ID=${activation.activationId}`,
    `LICENSE_TIER=${record.tier}`,
    `LICENSE_CUSTOMER=${record.customer}`,
    `LICENSE_SERVER_URL=${process.env.PUBLIC_LICENSE_SERVER_URL || `http://localhost:${port}`}`,
  ].join('\n');
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/licenses/activate', (req, res) => {
  const { licenseKey, machineId } = req.body as { licenseKey?: string; machineId?: string };

  if (!licenseKey || !machineId) {
    return res.status(400).json({ error: 'licenseKey and machineId are required' });
  }

  const records = readStore();
  const record = findRecord(records, licenseKey);

  if (!record) {
    return res.status(404).json({ error: 'license_not_found' });
  }

  if (record.status !== 'active') {
    return res.status(403).json({ error: 'license_revoked' });
  }

  let activation = record.activations.find((item) => item.machineId === machineId);

  if (!activation) {
    if (record.activations.length >= record.maxActivations) {
      return res.status(403).json({ error: 'activation_limit_reached' });
    }

    activation = {
      activationId: crypto.randomUUID(),
      machineId,
      activatedAt: new Date().toISOString(),
    };
    record.activations.push(activation);
    writeStore(records);
  }

  if ((req.headers.accept || '').includes('text/plain')) {
    res.type('text/plain');
    return res.send(envResponse(record, activation));
  }

  return res.json({
    activated: true,
    customer: record.customer,
    tier: record.tier,
    activation,
  });
});

app.post('/licenses/validate', (req, res) => {
  const { licenseKey, machineId, activationId } = req.body as {
    licenseKey?: string;
    machineId?: string;
    activationId?: string;
  };

  if (!licenseKey || !machineId) {
    return res.status(400).json({ error: 'licenseKey and machineId are required' });
  }

  const records = readStore();
  const record = findRecord(records, licenseKey);

  if (!record) {
    return res.status(404).json({ error: 'license_not_found' });
  }

  if (record.status !== 'active') {
    return res.status(403).json({ error: 'license_revoked' });
  }

  const activation = record.activations.find(
    (item) =>
      item.machineId === machineId && (!activationId || item.activationId === activationId)
  );

  if (!activation) {
    return res.status(403).json({ error: 'activation_not_found' });
  }

  return res.json({
    valid: true,
    customer: record.customer,
    tier: record.tier,
    activation,
  });
});

app.listen(port, () => {
  console.log(`License service listening on port ${port}`);
});
