import fs from 'fs';

export type ApiTier = 'starter' | 'pro' | 'fund' | 'enterprise';

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

interface DailyUsage {
  date: string;
  count: number;
}

export class ApiKeyStore {
  private readonly keysByValue = new Map<string, ApiKeyRecord>();

  constructor(private readonly keyStorePath: string) {
    this.reload();
  }

  reload(): void {
    const file = fs.readFileSync(this.keyStorePath, 'utf8');
    const records = JSON.parse(file) as ApiKeyRecord[];
    this.keysByValue.clear();

    for (const record of records) {
      this.keysByValue.set(record.key, record);
    }
  }

  getByKey(key: string): ApiKeyRecord | null {
    const record = this.keysByValue.get(key);

    if (!record || !record.active) {
      return null;
    }

    return record;
  }

  count(): number {
    return this.keysByValue.size;
  }
}

export class DailyRateLimiter {
  private readonly usage = new Map<string, DailyUsage>();

  consume(key: string, dailyLimit: number | null): { allowed: boolean; remaining: number | null } {
    if (dailyLimit === null) {
      return { allowed: true, remaining: null };
    }

    const today = new Date().toISOString().slice(0, 10);
    const current = this.usage.get(key);

    if (!current || current.date !== today) {
      this.usage.set(key, { date: today, count: 1 });
      return { allowed: true, remaining: dailyLimit - 1 };
    }

    if (current.count >= dailyLimit) {
      return { allowed: false, remaining: 0 };
    }

    current.count += 1;

    return { allowed: true, remaining: dailyLimit - current.count };
  }
}
