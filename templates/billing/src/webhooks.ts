import Stripe from 'stripe';
import { ClientStore } from './client-store';
import { getTierFromPriceId } from './stripe';

function firstPriceId(subscription: Stripe.Subscription): string {
  const priceId = subscription.items.data[0]?.price?.id;

  if (!priceId) {
    throw new Error('Subscription is missing a Stripe price id');
  }

  return priceId;
}

export function handleStripeEvent(event: Stripe.Event, store: ClientStore): void {
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const statusAllowsAccess = subscription.status === 'active' || subscription.status === 'trialing';

      if (!statusAllowsAccess) {
        store.deactivateBySubscriptionId(subscription.id);
        return;
      }

      const tier = getTierFromPriceId(firstPriceId(subscription));
      const clientName =
        subscription.metadata.clientName ||
        subscription.metadata.company ||
        subscription.customer?.toString() ||
        'Unknown client';

      store.upsertStripeClient({
        clientName,
        tier,
        email: subscription.metadata.email,
        stripeCustomerId: subscription.customer?.toString(),
        stripeSubscriptionId: subscription.id,
        notes: `Stripe subscription ${subscription.id}`,
      });
      return;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      store.deactivateBySubscriptionId(subscription.id);
      return;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const invoiceWithSubscription = invoice as Stripe.Invoice & {
        subscription?: string | Stripe.Subscription | null;
      };
      const subscriptionId =
        typeof invoiceWithSubscription.subscription === 'string'
          ? invoiceWithSubscription.subscription
          : invoiceWithSubscription.subscription?.id;

      if (subscriptionId) {
        store.deactivateBySubscriptionId(subscriptionId);
      }
      return;
    }

    default:
      return;
  }
}
