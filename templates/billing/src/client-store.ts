import crypto from 'crypto';
import fs from 'fs';
import { ApiTier, getAumCapUsd, getDailyCallLimit } from './config';

export interface ApiKeyRecord {
  key: string;
  clientName: string;
  tier: ApiTier;
  aumCapUsd: number;
  dailyCallLimit: number | null;
  createdAt: string;
  active: boolean;
  email?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  notes?: string;
  deactivatedAt?: string;
}

export interface ClientInput {
  clientName: string;
  tier: ApiTier;
  email?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  notes?: string;
}

export class ClientStore {
  constructor(private readonly storePath: string) {}

  private read(): ApiKeyRecord[] {
    return JSON.parse(fs.readFileSync(this.storePath, 'utf8')) as ApiKeyRecord[];
  }

  private write(records: ApiKeyRecord[]): void {
    fs.writeFileSync(this.storePath, JSON.stringify(records, null, 2) + '\n', 'utf8');
  }

  private generateApiKey(): string {
    return `smev_${crypto.randomBytes(24).toString('hex')}`;
  }

  upsertStripeClient(input: ClientInput): ApiKeyRecord {
    const records = this.read();
    const existing = records.find(
      (record) =>
        record.stripeSubscriptionId &&
        input.stripeSubscriptionId &&
        record.stripeSubscriptionId === input.stripeSubscriptionId
    );

    if (existing) {
      existing.clientName = input.clientName;
      existing.tier = input.tier;
      existing.aumCapUsd = getAumCapUsd(input.tier);
      existing.dailyCallLimit = getDailyCallLimit(input.tier);
      existing.email = input.email;
      existing.stripeCustomerId = input.stripeCustomerId;
      existing.stripeSubscriptionId = input.stripeSubscriptionId;
      existing.notes = input.notes;
      existing.active = true;
      delete existing.deactivatedAt;
      this.write(records);
      return existing;
    }

    const created: ApiKeyRecord = {
      key: this.generateApiKey(),
      clientName: input.clientName,
      tier: input.tier,
      aumCapUsd: getAumCapUsd(input.tier),
      dailyCallLimit: getDailyCallLimit(input.tier),
      createdAt: new Date().toISOString(),
      active: true,
      email: input.email,
      stripeCustomerId: input.stripeCustomerId,
      stripeSubscriptionId: input.stripeSubscriptionId,
      notes: input.notes,
    };

    records.push(created);
    this.write(records);
    return created;
  }

  issueManualClient(input: ClientInput): ApiKeyRecord {
    const records = this.read();
    const created: ApiKeyRecord = {
      key: this.generateApiKey(),
      clientName: input.clientName,
      tier: input.tier,
      aumCapUsd: getAumCapUsd(input.tier),
      dailyCallLimit: getDailyCallLimit(input.tier),
      createdAt: new Date().toISOString(),
      active: true,
      email: input.email,
      notes: input.notes,
    };

    records.push(created);
    this.write(records);
    return created;
  }

  deactivateBySubscriptionId(subscriptionId: string): ApiKeyRecord | null {
    const records = this.read();
    const match = records.find((record) => record.stripeSubscriptionId === subscriptionId);

    if (!match) {
      return null;
    }

    match.active = false;
    match.deactivatedAt = new Date().toISOString();
    this.write(records);
    return match;
  }
}
