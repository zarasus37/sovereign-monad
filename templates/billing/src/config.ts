import path from 'path';
import Stripe from 'stripe';

export type ApiTier = 'starter' | 'pro' | 'fund' | 'enterprise';
export type BillingInterval = 'monthly' | 'annual';

export interface TierPriceIds {
  monthly: string;
  annual: string;
}

export interface BillingConfig {
  port: number;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  stripeApiVersion: Stripe.LatestApiVersion;
  checkoutSuccessUrl: string;
  checkoutCancelUrl: string;
  portalReturnUrl: string;
  apiKeyStorePath: string;
  inquiryStorePath: string;
  priceIds: Record<ApiTier, TierPriceIds>;
}

let config: BillingConfig | null = null;

export function getBillingConfig(): BillingConfig {
  if (config) {
    return config;
  }

  config = {
    port: parseInt(process.env.PORT || '3010', 10),
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    stripeApiVersion: '2025-08-27.basil',
    checkoutSuccessUrl:
      process.env.CHECKOUT_SUCCESS_URL ||
      'https://billing.your-domain.example/success?session_id={CHECKOUT_SESSION_ID}',
    checkoutCancelUrl:
      process.env.CHECKOUT_CANCEL_URL || 'https://billing.your-domain.example/cancel',
    portalReturnUrl:
      process.env.PORTAL_RETURN_URL || 'https://billing.your-domain.example/account',
    apiKeyStorePath:
      process.env.API_KEY_STORE_PATH ||
      path.resolve(__dirname, '../../api/config/api-keys.json'),
    inquiryStorePath:
      process.env.INQUIRY_STORE_PATH || path.resolve(__dirname, '../config/inquiries.json'),
    priceIds: {
      starter: {
        monthly:
          process.env.STRIPE_STARTER_MONTHLY_PRICE_ID ||
          process.env.STRIPE_STARTER_PRICE_ID ||
          '',
        annual:
          process.env.STRIPE_STARTER_ANNUAL_PRICE_ID ||
          process.env.STRIPE_STARTER_PRICE_ID ||
          '',
      },
      pro: {
        monthly:
          process.env.STRIPE_PRO_MONTHLY_PRICE_ID ||
          process.env.STRIPE_PRO_PRICE_ID ||
          '',
        annual:
          process.env.STRIPE_PRO_ANNUAL_PRICE_ID ||
          process.env.STRIPE_PRO_PRICE_ID ||
          '',
      },
      fund: {
        monthly:
          process.env.STRIPE_FUND_MONTHLY_PRICE_ID ||
          process.env.STRIPE_FUND_PRICE_ID ||
          '',
        annual:
          process.env.STRIPE_FUND_ANNUAL_PRICE_ID ||
          process.env.STRIPE_FUND_PRICE_ID ||
          '',
      },
      enterprise: {
        monthly:
          process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID ||
          process.env.STRIPE_ENTERPRISE_PRICE_ID ||
          '',
        annual:
          process.env.STRIPE_ENTERPRISE_ANNUAL_PRICE_ID ||
          process.env.STRIPE_ENTERPRISE_PRICE_ID ||
          '',
      },
    },
  };

  return config;
}

export function getAumCapUsd(tier: ApiTier): number {
  switch (tier) {
    case 'starter':
      return 5_000_000;
    case 'pro':
      return 25_000_000;
    case 'fund':
      return 100_000_000;
    case 'enterprise':
      return 999_999_999_999;
  }
}

export function getDailyCallLimit(tier: ApiTier): number | null {
  switch (tier) {
    case 'starter':
      return 1000;
    case 'pro':
      return 10000;
    case 'fund':
    case 'enterprise':
      return null;
  }
}
