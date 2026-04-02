import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import { ClientStore } from './client-store';
import { getBillingConfig, ApiTier } from './config';
import { createStripeClient, getPriceIdForTier } from './stripe';
import { handleStripeEvent } from './webhooks';

dotenv.config();

const app = express();
const config = getBillingConfig();
const stripe = createStripeClient();
const store = new ClientStore(config.apiKeyStorePath);

app.use(cors());
app.use('/webhooks/stripe', express.raw({ type: 'application/json' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.post('/checkout/session', async (req: Request, res: Response) => {
  try {
    const { tier, clientName, email, successUrl, cancelUrl } = req.body as {
      tier?: ApiTier;
      clientName?: string;
      email?: string;
      successUrl?: string;
      cancelUrl?: string;
    };

    if (!tier || !clientName || !email) {
      return res.status(400).json({ error: 'tier, clientName, and email are required' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: getPriceIdForTier(tier),
          quantity: 1,
        },
      ],
      customer_email: email,
      success_url: successUrl || config.checkoutSuccessUrl,
      cancel_url: cancelUrl || config.checkoutCancelUrl,
      metadata: {
        clientName,
        email,
        tier,
      },
      subscription_data: {
        metadata: {
          clientName,
          email,
          tier,
        },
      },
      allow_promotion_codes: true,
    });

    return res.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'unable_to_create_checkout_session',
    });
  }
});

app.post('/portal/session', async (req: Request, res: Response) => {
  try {
    const { customerId, returnUrl } = req.body as { customerId?: string; returnUrl?: string };

    if (!customerId) {
      return res.status(400).json({ error: 'customerId is required' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || config.portalReturnUrl,
    });

    return res.json({ url: session.url });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'unable_to_create_portal_session',
    });
  }
});

app.post('/webhooks/stripe', (req: Request, res: Response) => {
  try {
    const signature = req.headers['stripe-signature'];

    if (!signature || Array.isArray(signature)) {
      return res.status(400).send('Missing Stripe signature');
    }

    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      config.stripeWebhookSecret
    );

    handleStripeEvent(event, store);
    return res.json({ received: true });
  } catch (error) {
    return res.status(400).send(
      error instanceof Error ? error.message : 'Webhook signature verification failed'
    );
  }
});

app.listen(config.port, () => {
  console.log(`Billing service running on port ${config.port}`);
});
