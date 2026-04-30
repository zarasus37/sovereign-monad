import Stripe from 'stripe';
import { ApiTier, BillingInterval, getBillingConfig } from './config';

let stripeClient: Stripe | null = null;

export function createStripeClient(): Stripe {
  if (stripeClient) {
    return stripeClient;
  }

  const config = getBillingConfig();

  if (!config.stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY is required');
  }

  stripeClient = new Stripe(config.stripeSecretKey, {
    apiVersion: config.stripeApiVersion,
  });

  return stripeClient;
}

export function getTierFromPriceId(priceId: string): ApiTier {
  const config = getBillingConfig();
  const entry = Object.entries(config.priceIds).find(
    ([, configured]) => configured.monthly === priceId || configured.annual === priceId
  );

  if (!entry) {
    throw new Error(`Unknown Stripe price id: ${priceId}`);
  }

  return entry[0] as ApiTier;
}

export function getPriceIdForTier(
  tier: ApiTier,
  billingInterval: BillingInterval = 'monthly'
): string {
  const config = getBillingConfig();
  const tierConfig = config.priceIds[tier];
  const priceId =
    billingInterval === 'annual'
      ? tierConfig.annual || tierConfig.monthly
      : tierConfig.monthly || tierConfig.annual;

  if (!priceId) {
    throw new Error(`Missing Stripe price id for tier ${tier} (${billingInterval})`);
  }

  return priceId;
}
