import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { ApiTier, BillingInterval } from './config';

export type InquiryKind =
  | 'sales_request'
  | 'checkout_request'
  | 'presale_reservation'
  | 'demo_request';

export interface RevenueInquiry {
  inquiryId: string;
  kind: InquiryKind;
  tier: ApiTier;
  billingInterval?: BillingInterval;
  clientName: string;
  email: string;
  organization?: string;
  aumRange?: string;
  note?: string;
  priceLabel?: string;
  sourcePage?: string;
  createdAt: string;
  status: 'new';
}

export interface RevenueInquiryInput {
  kind: InquiryKind;
  tier: ApiTier;
  billingInterval?: BillingInterval;
  clientName: string;
  email: string;
  organization?: string;
  aumRange?: string;
  note?: string;
  priceLabel?: string;
  sourcePage?: string;
}

export class InquiryStore {
  constructor(private readonly storePath: string) {
    this.ensureStore();
  }

  private ensureStore(): void {
    const dir = path.dirname(this.storePath);
    fs.mkdirSync(dir, { recursive: true });

    if (!fs.existsSync(this.storePath)) {
      fs.writeFileSync(this.storePath, '[]\n', 'utf8');
    }
  }

  private read(): RevenueInquiry[] {
    this.ensureStore();
    return JSON.parse(fs.readFileSync(this.storePath, 'utf8')) as RevenueInquiry[];
  }

  private write(records: RevenueInquiry[]): void {
    this.ensureStore();
    fs.writeFileSync(this.storePath, JSON.stringify(records, null, 2) + '\n', 'utf8');
  }

  create(input: RevenueInquiryInput): RevenueInquiry {
    const records = this.read();
    const record: RevenueInquiry = {
      inquiryId: crypto.randomUUID(),
      kind: input.kind,
      tier: input.tier,
      billingInterval: input.billingInterval,
      clientName: input.clientName,
      email: input.email,
      organization: input.organization,
      aumRange: input.aumRange,
      note: input.note,
      priceLabel: input.priceLabel,
      sourcePage: input.sourcePage,
      createdAt: new Date().toISOString(),
      status: 'new',
    };

    records.push(record);
    this.write(records);
    return record;
  }

  count(): number {
    return this.read().length;
  }
}
