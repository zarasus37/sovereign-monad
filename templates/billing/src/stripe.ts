import Stripe from 'stripe';
import { ApiTier, getBillingConfig } from './config';

export function createStripeClient(): Stripe {
  const config = getBillingConfig();

  if (!config.stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY is required');
  }

  return new Stripe(config.stripeSecretKey, {
    apiVersion: config.stripeApiVersion,
  });
}

export function getTierFromPriceId(priceId: string): ApiTier {
  const config = getBillingConfig();
  const entry = Object.entries(config.priceIds).find(([, configuredPriceId]) => configuredPriceId === priceId);

  if (!entry) {
    throw new Error(`Unknown Stripe price id: ${priceId}`);
  }

  return entry[0] as ApiTier;
}

export function getPriceIdForTier(tier: ApiTier): string {
  const config = getBillingConfig();
  const priceId = config.priceIds[tier];

  if (!priceId) {
    throw new Error(`Missing Stripe price id for tier ${tier}`);
  }

  return priceId;
}
